import { timingSafeEqual } from 'crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { DuplicateVoucherError, ingestShopriteCheckersVoucher } from '../lib/ingestVoucher';
import { json, requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});

type TelegramConfig = {
  botToken: string;
  allowedChatIds?: Array<string | number>;
};

let cachedBotConfig: TelegramConfig | undefined;
let cachedWebhookSecret: string | undefined;

const getTelegramBotConfig = async (): Promise<TelegramConfig> => {
  if (cachedBotConfig) return cachedBotConfig;

  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_TELEGRAM_BOT_TOKEN_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as TelegramConfig;
  if (!parsed.botToken) {
    throw new Error('Telegram bot token secret missing botToken.');
  }
  cachedBotConfig = parsed;
  return cachedBotConfig;
};

const getWebhookSecret = async (): Promise<string> => {
  if (cachedWebhookSecret) return cachedWebhookSecret;

  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_TELEGRAM_WEBHOOK_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { secretToken?: string };
  if (!parsed.secretToken) {
    throw new Error('Telegram webhook secret missing secretToken.');
  }
  cachedWebhookSecret = parsed.secretToken;
  return cachedWebhookSecret;
};

const assertWebhookSecret = async (provided?: string) => {
  if (!provided) {
    throw new Error('Missing Telegram webhook secret.');
  }

  const expected = await getWebhookSecret();
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid Telegram webhook secret.');
  }
};

const sendTelegramMessage = async (botToken: string, chatId: string | number, text: string) => {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    await assertWebhookSecret(
      event.headers['x-telegram-bot-api-secret-token'] ??
        event.headers['X-Telegram-Bot-Api-Secret-Token']
    );

    const update = event.body ? (JSON.parse(event.body) as Record<string, unknown>) : {};
    const message = (update.message ?? update.channel_post) as
      | {
          text?: string;
          chat?: { id?: number | string };
          from?: { username?: string };
        }
      | undefined;

    if (!message?.text || !message.chat?.id) {
      return json(200, { ok: true, ignored: 'No text message to process.' });
    }

    const { botToken, allowedChatIds } = await getTelegramBotConfig();
    const normalizedChatId = String(message.chat.id);
    console.info(
      JSON.stringify({
        event: 'telegram.voucher.message.received',
        chatId: normalizedChatId,
        username: message.from?.username ?? null,
      })
    );
    const isAllowed =
      !allowedChatIds || allowedChatIds.length === 0
        ? true
        : allowedChatIds.map(String).includes(normalizedChatId);

    if (!isAllowed) {
      await sendTelegramMessage(botToken, message.chat.id, 'This chat is not authorized.');
      return json(200, { ok: true, ignored: 'Unauthorized chat.' });
    }

    try {
      const result = await ingestShopriteCheckersVoucher({
        smsText: message.text,
        source: 'telegram-admin-bot',
        actorId: `telegram:${normalizedChatId}`,
        actorType: 'administrator',
        ingestedByUserId: `telegram:${normalizedChatId}`,
        ingestedByActorId: `telegram:${normalizedChatId}`,
      });

      await sendTelegramMessage(
        botToken,
        message.chat.id,
        [
          'Voucher stored.',
          `Supplier: ${result.supplier}`,
          `Amount: R${result.amount.toFixed(2)}`,
          `Barcode: ${result.barcodeMasked}`,
          `Status: ${result.status}`,
        ].join('\n')
      );
    } catch (error) {
      if (error instanceof DuplicateVoucherError) {
        await sendTelegramMessage(botToken, message.chat.id, 'Voucher already loaded.');
      } else {
        const messageText = error instanceof Error ? error.message : 'Unknown ingest error.';
        await sendTelegramMessage(
          botToken,
          message.chat.id,
          `Voucher ingest failed: ${messageText}`
        );
      }
    }

    return json(200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode =
      message === 'Missing Telegram webhook secret.' ||
      message === 'Invalid Telegram webhook secret.'
        ? 401
        : 400;
    return json(statusCode, { message });
  }
};
