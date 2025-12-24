import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { toBuffer as qrcodeToBuffer } from 'qrcode';
import { CreateTipIntentDto } from './dto/create-tip-intent.dto';
import { CreateSandboxTopupDto } from './dto/create-sandbox-topup.dto';
import { CurrencyCode, GuardProfile, TipIntent } from '@pashashapay/contracts';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { CivilServantEntity } from '../profiles/entities/civil-servant.entity';
import { EclipseService } from '../payments/eclipse.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentWorkflowService } from '../payments/payment-workflow.service';

type PaymentResponse = {
  paymentId?: string;
  id?: string;
  completionUrl?: string | null;
  redirectUrl?: string | null;
  qrCodeUrl?: string | null;
  status?: string;
  [key: string]: unknown;
};

const MIN_TIP = 5;
const MAX_TIP = 2000;

const guardPortalBaseFromEnv =
  process.env.GUARD_PORTAL_BASE_URL ?? process.env.FRONTEND_BASE_URL;

const guardPortalBase =
  (guardPortalBaseFromEnv
    ? guardPortalBaseFromEnv.replace(/\/$/, '')
    : 'https://main.d2vxflzymkt19g.amplifyapp.com') + '/g?token=';

@Injectable()
export class GuardsService {
  private readonly logger = new Logger(GuardsService.name);

  private readonly qrToBuffer: (
    text: string,
    options?: unknown,
  ) => Promise<Buffer | string | Uint8Array> = qrcodeToBuffer as (
    text: string,
    options?: unknown,
  ) => Promise<Buffer | string | Uint8Array>;

  constructor(
    private readonly repository: CivilServantRepository,
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
    private readonly paymentWorkflow: PaymentWorkflowService,
  ) {}

  private toStringValue(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return undefined;
  }

  private mapEntityToProfile(
    entity: CivilServantEntity,
    token: string,
  ): GuardProfile {
    return {
      id: entity.civilServantId,
      token,
      name: `Officer ${entity.firstName} ${entity.familyName}`,
      location: entity.address ?? 'Assigned site',
      shift: 'On duty',
      yearsOfService: 1,
      motto: 'Dedicated to your safety.',
      photoUrl: '/guard-placeholder.svg',
      payoutChannel: 'manual',
      quickAmounts: [20, 50, 100, 150],
      lastUpdated: entity.updatedAt ?? new Date().toISOString(),
    };
  }

  async findGuardByToken(token: string): Promise<GuardProfile> {
    const entity = await this.repository.findByGuardToken(token);
    if (!entity) {
      throw new NotFoundException({
        message: 'Guard not found',
        guardToken: token,
      });
    }
    return this.mapEntityToProfile(entity, token);
  }

  async rotateGuardToken(oldToken: string) {
    const entity = await this.repository.findByGuardToken(oldToken);
    if (!entity) {
      throw new NotFoundException({
        message: 'Guard not found',
        guardToken: oldToken,
      });
    }

    const newToken = randomUUID().replace(/-/g, '');
    await this.repository.update(entity.civilServantId, {
      guardToken: newToken,
    });

    this.logger.log(
      `Guard token rotated for civilServantId=${entity.civilServantId} oldToken=${oldToken}`,
    );

    const landingUrl = guardPortalBase + encodeURIComponent(newToken);

    return {
      civilServantId: entity.civilServantId,
      guardToken: newToken,
      landingUrl,
    };
  }

  async generateGuardQrCode(
    token: string,
    skipValidation = false,
  ): Promise<{ buffer: Buffer; landingUrl: string }> {
    if (!skipValidation) {
      await this.findGuardByToken(token);
    }
    const landingUrl = guardPortalBase + encodeURIComponent(token);
    const rawBuffer: unknown = await this.qrToBuffer(landingUrl, {
      width: 512,
      margin: 1,
      type: 'png',
      errorCorrectionLevel: 'H',
    });
    const buffer = Buffer.isBuffer(rawBuffer)
      ? rawBuffer
      : Buffer.from(rawBuffer as Uint8Array);
    return { buffer, landingUrl };
  }

  async createTipIntent(dto: CreateTipIntentDto): Promise<TipIntent> {
    const entity = await this.repository.findByGuardToken(dto.guardToken);
    if (!entity) {
      throw new NotFoundException('Guard not found');
    }
    const normalizedAmount = Math.round(Number(dto.amount) * 100) / 100;

    if (Number.isNaN(normalizedAmount)) {
      throw new BadRequestException('Invalid amount');
    }

    if (normalizedAmount < MIN_TIP || normalizedAmount > MAX_TIP) {
      throw new BadRequestException(
        `Amount must be between ${MIN_TIP} and ${MAX_TIP} ZAR`,
      );
    }

    if (!entity.eclipseWalletId) {
      throw new BadRequestException(
        'Guard wallet not linked. Please link an Eclipse wallet before accepting tips.',
      );
    }

    const currency = (dto.currency ?? 'ZAR').toUpperCase();

    if (!['ZAR', 'USD', 'NGN'].includes(currency)) {
      throw new BadRequestException('Unsupported currency');
    }

    const externalId = `tip-${randomUUID().replace(/-/g, '')}`;

    // Initiate Eclipse payment using a generic payment link (works across redirect/QR).
    const workflowResult = await this.paymentWorkflow.startCustomerPayment({
      amount: normalizedAmount,
      currency,
      destinationWalletId: entity.eclipseWalletId,
      customerId: entity.eclipseCustomerId,
      civilServantId: entity.civilServantId,
      guardToken: dto.guardToken,
      accountNumber: entity.accountNumber,
      yourReference: dto.yourReference,
      theirReference: dto.theirReference,
      externalUniqueId: externalId,
    });
    const paymentId =
      this.toStringValue(workflowResult?.paymentId ?? workflowResult?.id) ??
      externalId;
    const authorizationUrl =
      this.toStringValue(
        workflowResult?.authorizationUrl ||
          workflowResult?.redirectUrl ||
          workflowResult?.completionUrl,
      ) || guardPortalBase + encodeURIComponent(dto.guardToken);

    const intent: TipIntent = {
      intentId: paymentId,
      guardId: entity.civilServantId,
      guardToken: dto.guardToken,
      amount: normalizedAmount,
      currency: currency as CurrencyCode,
      paystackReference: paymentId,
      authorizationUrl,
      status: 'pending',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: {
        guardName: `Officer ${entity.firstName} ${entity.familyName}`,
        isPresetAmount: [20, 50, 100, 150].includes(
          Math.round(normalizedAmount),
        ),
        clientReference: dto.clientReference ?? null,
        deviceFingerprint: dto.deviceFingerprint ?? null,
        returnUrl: dto.returnUrl ?? null,
      },
    };

    return intent;
  }

  async createSandboxTopup(guardToken: string, dto: CreateSandboxTopupDto) {
    this.logger.log(
      `Sandbox topup requested for guard ${guardToken}: amount=${dto.amount}, currency=${dto.currency}`,
    );

    const entity = await this.repository.findByGuardToken(guardToken);
    if (!entity) {
      throw new NotFoundException('Guard not found');
    }

    const normalizedAmount = Math.round(Number(dto.amount) * 100) / 100;
    if (Number.isNaN(normalizedAmount)) {
      throw new BadRequestException('Invalid amount');
    }

    if (!entity.eclipseWalletId) {
      throw new BadRequestException(
        'Guard wallet not linked. Please link an Eclipse wallet before accepting tips.',
      );
    }

    const currency = (dto.currency ?? 'ZAR').toUpperCase();

    let paymentResponse: PaymentResponse;
    const externalId = `sandbox-${randomUUID().replace(/-/g, '')}`;
    try {
      paymentResponse = await this.eclipse.createPayment({
        type: 'GLOBAL_PAYMENT_LINK',
        amount: normalizedAmount,
        currency,
        destinationWalletId: Number(entity.eclipseWalletId),
        customerId: entity.eclipseCustomerId,
        externalUniqueId: externalId,
        metadata: {
          guardToken,
          guardId: entity.civilServantId,
          accountNumber: entity.accountNumber,
          useCase: 'sandbox_topup',
        },
      });
    } catch (err) {
      // If Eclipse rejects the request, log and return a synthetic success so the demo flow continues.
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(
        `Eclipse sandbox topup failed; returning synthetic success. Error: ${errorMessage}`,
      );
      paymentResponse = {
        id: `sandbox_${randomUUID().replace(/-/g, '')}`,
        status: 'initiated',
        completionUrl: null,
        redirectUrl: null,
        qrCodeUrl: null,
        error: errorMessage,
      };
    }

    const paymentId =
      paymentResponse?.paymentId || paymentResponse?.id || externalId;

    return {
      paymentId,
      authorizationUrl:
        paymentResponse?.completionUrl ||
        paymentResponse?.redirectUrl ||
        paymentResponse?.qrCodeUrl ||
        null,
      status: paymentResponse?.status ?? 'initiated',
      raw: paymentResponse,
    };
  }
}
