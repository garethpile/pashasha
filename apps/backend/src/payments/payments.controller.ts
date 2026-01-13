import {
  Body,
  Controller,
  ForbiddenException,
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
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { EclipseService } from './eclipse.service';
import { PaymentsService } from './payments.service';
import {
  EclipsePaymentDto,
  EclipseWithdrawalDto,
  EclipseWalletDto,
  ReconcilePaymentsDto,
} from './dto/eclipse-payment.dto';
import { CustomersService } from '../customers/customers.service';

type JsonRequest = Request<ParamsDictionary, unknown, Record<string, unknown>>;
type RawJsonRequest = RawBodyRequest<JsonRequest>;

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
    private readonly customers: CustomersService,
  ) {}

  private isAdmin(user?: { ['cognito:groups']?: string[] }) {
    const groups = user?.['cognito:groups'] ?? [];
    return groups
      .map((g) => g.toLowerCase().replace(/[\s_-]/g, ''))
      .some((g) => g === 'administrators' || g === 'admin');
  }

  @Roles('Customers', 'Administrators')
  @Post('payments/eclipse')
  @Throttle({ payout: { limit: 8, ttl: 60 } })
  async createPayment(
    @Body() dto: EclipsePaymentDto,
    @CurrentUser()
    user: {
      sub?: string;
      username?: string;
      ['cognito:groups']?: string[];
    } = {},
  ) {
    const isAdmin = this.isAdmin(user);

    // Non-admin callers must use their own wallet/customer IDs.
    if (!isAdmin) {
      const customerId = user.sub ?? user.username;
      if (!customerId) {
        throw new ForbiddenException('Missing customer identity');
      }
      const customer = await this.customers.findByUser(customerId);
      if (!customer.eclipseWalletId || !customer.eclipseCustomerId) {
        throw new ForbiddenException('Wallet not linked for this customer');
      }
      dto.walletId = customer.eclipseWalletId;
      dto.destinationWalletId = customer.eclipseWalletId;
      dto.customerId = customer.eclipseCustomerId;
    }

    // Minimal amount sanity to avoid zero/negative attempts.
    if (dto.amount <= 0) {
      throw new ForbiddenException('Amount must be positive');
    }

    return this.eclipse.createPayment(dto);
  }

  @Roles('Administrators')
  @Get('payments/eclipse/:paymentId')
  async getPayment(@Req() req: Request<{ paymentId: string }>) {
    return this.eclipse.getPayment(req.params.paymentId);
  }

  @Roles('Customers', 'Administrators')
  @Post('payments/eclipse/withdrawals')
  @Throttle({ payout: { limit: 5, ttl: 120 } })
  async createWithdrawal(
    @Body() dto: EclipseWithdrawalDto,
    @CurrentUser()
    user: {
      sub?: string;
      username?: string;
      ['cognito:groups']?: string[];
    } = {},
  ) {
    const isAdmin = this.isAdmin(user);
    if (!isAdmin) {
      const customerId = user.sub ?? user.username;
      if (!customerId) {
        throw new ForbiddenException('Missing customer identity');
      }
      const customer = await this.customers.findByUser(customerId);
      if (!customer.eclipseWalletId) {
        throw new ForbiddenException('Wallet not linked for this customer');
      }
      dto.walletId = customer.eclipseWalletId;
    }

    if (dto.amount?.value <= 0) {
      throw new ForbiddenException('Withdrawal amount must be positive');
    }

    return this.eclipse.createWithdrawal(dto);
  }

  @Post('payments/eclipse/wallets')
  @Throttle({ payout: { limit: 10, ttl: 300 } })
  async createWallet(@Body() dto: EclipseWalletDto) {
    // Restrict wallet creation to admins to avoid orphaned wallets.
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
    if (!ok) {
      this.logger.warn('Rejecting payment webhook with invalid signature');
      return { accepted: false, signatureVerified: false };
    }
    const payload = req.body ?? {};
    await this.payments.recordFromWebhook(payload);
    return { accepted: true, signatureVerified: true };
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
