import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { Public } from '../auth/public.decorator';
import { EclipseService } from './eclipse.service';
import { PaymentsService } from './payments.service';
import {
  EclipsePaymentDto,
  EclipseWithdrawalDto,
  EclipseWalletDto,
  ReconcilePaymentsDto,
} from './dto/eclipse-payment.dto';

type JsonRequest = Request<ParamsDictionary, unknown, Record<string, unknown>>;
type RawJsonRequest = RawBodyRequest<JsonRequest>;

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
  ) {}

  @Post('payments/eclipse')
  @Throttle({ payout: { limit: 8, ttl: 60 } })
  async createPayment(@Body() dto: EclipsePaymentDto) {
    // In production, validate amounts, guard wallet lookup, and persist payment records.
    return this.eclipse.createPayment(dto);
  }

  @Get('payments/eclipse/:paymentId')
  async getPayment(@Req() req: Request<{ paymentId: string }>) {
    const paymentId = req.params.paymentId;
    return this.eclipse.getPayment(paymentId);
  }

  @Post('payments/eclipse/withdrawals')
  @Throttle({ payout: { limit: 5, ttl: 120 } })
  async createWithdrawal(@Body() dto: EclipseWithdrawalDto) {
    // In production, validate wallet ownership, limit checks, and persist withdrawal records.
    return this.eclipse.createWithdrawal(dto);
  }

  @Post('payments/eclipse/wallets')
  @Throttle({ payout: { limit: 10, ttl: 300 } })
  async createWallet(@Body() dto: EclipseWalletDto) {
    // In production, link to guard/customer record and persist the walletId.
    return this.eclipse.createWallet(dto);
  }

  @Public()
  @Post('webhooks/eclipse/payments')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Req() req: RawJsonRequest,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody = req.rawBody
      ? req.rawBody.toString()
      : JSON.stringify(req.body ?? {});
    const ok = this.eclipse.verifyWebhookSignature(rawBody, signature);
    const meta = {
      signaturePresent: !!signature,
      verified: ok,
      rawLength: rawBody.length,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    };
    const snippet = rawBody.length > 0 ? rawBody.slice(0, 512) : '<empty>';
    this.logger.log(
      `Eclipse webhook received: ${JSON.stringify(meta)} rawSnippet=${snippet}`,
    );
    // Temporarily accept unsigned/failed signatures to debug payload arrival.
    const payload = req.body ?? {};
    await this.payments.recordFromWebhook(payload);
    return { accepted: ok, signatureVerified: ok };
  }

  @Public()
  @Post('webhooks/eclipse/withdrawals')
  @HttpCode(HttpStatus.OK)
  handleWithdrawalWebhook(
    @Req() req: RawJsonRequest,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody = req.rawBody ? req.rawBody.toString() : '';
    const ok = this.eclipse.verifyWebhookSignature(rawBody, signature);
    if (!ok) {
      return { accepted: false };
    }
    return { accepted: true };
  }

  @Post('payments/reconcile')
  async reconcile(@Body() dto: ReconcilePaymentsDto) {
    return this.payments.reconcileRecent(dto.days ?? 7);
  }

  /**
   * Utility endpoint to validate webhook signature format.
   * Pass { "body": {...}, "signature": "sha256=..." } to confirm match.
   */
  @Post('payments/webhook/test-signature')
  @HttpCode(HttpStatus.OK)
  testSignature(
    @Body('body') body?: Record<string, unknown>,
    @Body('signature') signature?: string,
  ) {
    const raw = body ? JSON.stringify(body) : '';
    const ok = this.eclipse.verifyWebhookSignature(raw, signature);
    return { accepted: ok, raw };
  }
}
