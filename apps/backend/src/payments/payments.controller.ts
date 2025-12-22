import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { EclipseService } from './eclipse.service';
import {
  EclipsePaymentRequest,
  EclipseWithdrawalRequest,
  EclipseWalletRequest,
} from './eclipse.types';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
  ) {}

  @Post('payments/eclipse')
  async createPayment(@Body() dto: EclipsePaymentRequest) {
    // In production, validate amounts, guard wallet lookup, and persist payment records.
    return this.eclipse.createPayment(dto);
  }

  @Get('payments/eclipse/:paymentId')
  async getPayment(@Req() req: Request) {
    // Support either path param or body for convenience.
    const paymentId = (req.params as any)?.paymentId;
    return this.eclipse.getPayment(paymentId);
  }

  @Post('payments/eclipse/withdrawals')
  async createWithdrawal(@Body() dto: EclipseWithdrawalRequest) {
    // In production, validate wallet ownership, limit checks, and persist withdrawal records.
    return this.eclipse.createWithdrawal(dto);
  }

  @Post('payments/eclipse/wallets')
  async createWallet(@Body() dto: EclipseWalletRequest) {
    // In production, link to guard/customer record and persist the walletId.
    return this.eclipse.createWallet(dto);
  }

  @Public()
  @Post('webhooks/eclipse/payments')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody =
      ((req as any).rawBody?.toString() ??
      (req as any).bodyText ??
      (req as any).text ??
      (req as any).body)
        ? JSON.stringify((req as any).body)
        : '';
    const ok = this.eclipse.verifyWebhookSignature(rawBody, signature);
    const meta = {
      signaturePresent: !!signature,
      verified: ok,
      rawLength: rawBody.length,
      contentType: (req.headers as any)['content-type'],
      contentLength: (req.headers as any)['content-length'],
    };
    const snippet = rawBody.length > 0 ? rawBody.slice(0, 512) : '<empty>';
    this.logger.log(
      `Eclipse webhook received: ${JSON.stringify(meta)} rawSnippet=${snippet}`,
    );
    // Temporarily accept unsigned/failed signatures to debug payload arrival.
    const payload = (req as any).body ?? {};
    await this.payments.recordFromWebhook(payload);
    return { accepted: ok, signatureVerified: ok };
  }

  @Public()
  @Post('webhooks/eclipse/withdrawals')
  @HttpCode(HttpStatus.OK)
  async handleWithdrawalWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody = (req as any).rawBody?.toString() ?? '';
    const ok = this.eclipse.verifyWebhookSignature(rawBody, signature);
    if (!ok) {
      return { accepted: false };
    }
    return { accepted: true };
  }

  @Post('payments/reconcile')
  async reconcile(@Body('days') days?: number) {
    return this.payments.reconcileRecent(days ?? 7);
  }

  /**
   * Utility endpoint to validate webhook signature format.
   * Pass { "body": {...}, "signature": "sha256=..." } to confirm match.
   */
  @Post('payments/webhook/test-signature')
  @HttpCode(HttpStatus.OK)
  async testSignature(
    @Body('body') body: any,
    @Body('signature') signature?: string,
  ) {
    const raw = body ? JSON.stringify(body) : '';
    const ok = this.eclipse.verifyWebhookSignature(raw, signature);
    return { accepted: ok, raw };
  }
}
