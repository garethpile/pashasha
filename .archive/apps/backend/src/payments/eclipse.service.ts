import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  EclipseConfig,
  EclipsePaymentRequest,
  EclipseWithdrawalRequest,
  EclipseWalletRequest,
  EclipseCustomerRequest,
  EclipseCustomerWalletRequest,
} from './eclipse.types';

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class EclipseService {
  private readonly logger = new Logger(EclipseService.name);
  private token: TokenState | null = null;
  private readonly cfg: EclipseConfig;

  constructor(private readonly config: ConfigService) {
    const normalize = (value: string) => {
      const v = (value ?? '').trim();
      if (!v) return '';
      // Prevent placeholder secrets from enabling an auth flow that will never work.
      if (/^placeholder[-_]/i.test(v)) return '';
      return v;
    };

    this.cfg = {
      apiBase:
        this.config.get<string>('ECLIPSE_API_BASE') ??
        'https://sandbox.api.eftcorp.co.za',
      tenantId: normalize(this.config.get<string>('ECLIPSE_TENANT_ID') ?? ''),
      clientId: normalize(this.config.get<string>('ECLIPSE_CLIENT_ID') ?? ''),
      clientSecret: normalize(
        this.config.get<string>('ECLIPSE_CLIENT_SECRET') ?? '',
      ),
      tenantIdentity: normalize(
        this.config.get<string>('ECLIPSE_TENANT_IDENTITY') ?? '',
      ),
      tenantPassword: normalize(
        this.config.get<string>('ECLIPSE_TENANT_PASSWORD') ?? '',
      ),
      webhookSecret: this.config.get<string>('ECLIPSE_WEBHOOK_SECRET') ?? '',
      callbackBase: this.config.get<string>('ECLIPSE_CALLBACK_BASE') ?? '',
    };
  }

  private rootBase(): string {
    const raw = (this.cfg.apiBase ?? '').trim().replace(/\/$/, '');
    // If a full conductor base is provided, strip it to the root host.
    return raw.replace(/\/eclipse-conductor\/rest\/v1\/?$/, '');
  }

  private conductorBases(): string[] {
    const raw = (this.cfg.apiBase ?? '').trim().replace(/\/$/, '');
    const hasConductorSuffix = /\/eclipse-conductor\/rest\/v1\/?$/.test(raw);
    if (hasConductorSuffix) return [raw];

    const root = this.rootBase();
    const conductor = `${root}/eclipse-conductor/rest/v1`;

    // Heuristic: ukheshe sandbox uses the conductor prefix for all REST endpoints.
    if (root.includes('ukheshe.rocks')) return [conductor, root];
    return [root, conductor];
  }

  private conductorUrl(path: string): string {
    const base = this.conductorBases()[0];
    return `${base}/${path.replace(/^\//, '')}`;
  }

  private rootUrl(path: string): string {
    const base = this.rootBase().replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
  }

  private async fetchFirstOk(
    candidates: string[],
    init: RequestInit,
  ): Promise<{ url: string; response: Response; bodyText: string }> {
    let last: { url: string; response: Response; bodyText: string } | null =
      null;

    for (const url of candidates) {
      const response = await fetch(url, init);
      const bodyText = await response.text();
      last = { url, response, bodyText };
      if (response.ok) return last;
    }

    if (last) return last;
    throw new Error('No Eclipse URL candidates provided');
  }

  /**
   * Retrieves and caches an access token.
   * Prefers client credentials when configured; falls back to tenant identity/password login.
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) {
      return this.token.accessToken;
    }

    if (
      !this.cfg.clientId &&
      !this.cfg.clientSecret &&
      (!this.cfg.tenantIdentity || !this.cfg.tenantPassword)
    ) {
      throw new Error(
        'Eclipse credentials not configured (set ECLIPSE_TENANT_IDENTITY/ECLIPSE_TENANT_PASSWORD or ECLIPSE_CLIENT_ID/ECLIPSE_CLIENT_SECRET)',
      );
    }

    // Prefer OAuth client credentials when available.
    if (this.cfg.clientId && this.cfg.clientSecret) {
      const urlCandidates = [
        this.rootUrl('/oauth/token'),
        this.conductorUrl('/oauth/token'),
      ];
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.cfg.clientId,
        client_secret: this.cfg.clientSecret,
      });

      try {
        const { response, bodyText } = await this.fetchFirstOk(urlCandidates, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        const data = bodyText ? this.tryParseObject(bodyText) : {};

        const accessToken =
          typeof data.access_token === 'string' ? data.access_token : '';
        const expiresRaw =
          typeof data.expires_in === 'number'
            ? data.expires_in
            : Number(data.expires_in ?? 300);
        const expiresMs = Number.isFinite(expiresRaw)
          ? expiresRaw * 1000
          : 300 * 1000;

        if (accessToken) {
          this.token = {
            accessToken,
            expiresAt: now + expiresMs,
          };
          return this.token.accessToken;
        }

        this.logger.warn(
          `OAuth token endpoint returned empty token (status ${response.status}); falling back to login if available`,
        );
      } catch (err) {
        this.logger.warn(
          `OAuth token flow failed; falling back to login if available: ${(err as Error).message}`,
        );
      }
    }

    // Fallback: tenant identity/password login (sandbox-only convenience).
    const loginUrl = this.conductorUrl('/authentication/login');
    const payload = {
      identity: this.cfg.tenantIdentity,
      password: this.cfg.tenantPassword,
    };

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const bodyText = await response.text();
    const data = bodyText ? this.tryParseObject(bodyText) : {};

    if (!response.ok) {
      this.logger.error(
        `Eclipse login failed: status=${response.status} ${response.statusText || ''} body=${bodyText || '<empty>'}`,
      );
      throw new Error(
        `Eclipse login failed with status ${response.status}: ${bodyText || response.statusText}`,
      );
    }

    // The login endpoint returns { headerName, headerValue, expiresEpochSecs, ... }
    const bearer = typeof data.headerValue === 'string' ? data.headerValue : '';
    const accessToken = bearer?.replace(/^Bearer\s+/i, '').trim();
    const expiresAt =
      typeof data.expiresEpochSecs === 'number'
        ? data.expiresEpochSecs * 1000
        : now + 5 * 60 * 1000;

    if (!accessToken) {
      throw new Error('Failed to obtain Eclipse sandbox token via login');
    }

    this.token = {
      accessToken,
      expiresAt,
    };
    return this.token.accessToken;
  }

  private async authedHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initiate a payment (e.g., ZA_QRCODE or ZA_OZOW).
   */
  async createPayment(request: EclipsePaymentRequest) {
    const url = this.conductorUrl(`/tenants/${this.cfg.tenantId}/payments`);
    const headers = await this.authedHeaders();
    const payload = {
      ...request,
      callbackUrl:
        request.callbackUrl ??
        (this.cfg.callbackBase
          ? `${this.cfg.callbackBase.replace(/\/$/, '')}/webhooks/eclipse/payments`
          : undefined),
    };
    this.logger.log(
      `Eclipse createPayment -> ${url} (${request.type}) ${request.amount} ${request.currency} [destWallet=${request.destinationWalletId}] extRef=${request.externalUniqueId ?? 'n/a'}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const bodyText = await response.text();
    const data = bodyText ? this.tryParseObject(bodyText) : {};

    if (!response.ok) {
      this.logger.error(
        `Eclipse createPayment failed: status=${response.status} ${response.statusText || ''} body=${
          bodyText || '<empty>'
        } payload=${JSON.stringify({
          type: request.type,
          amount: request.amount,
          currency: request.currency,
          destinationWalletId: request.destinationWalletId ?? request.walletId,
          hasCallback: !!payload.callbackUrl,
          metadata: request.metadata,
          customerId: request.customerId,
        })}`,
      );
      throw new Error(
        `Eclipse createPayment failed with status ${response.status}: ${bodyText || response.statusText}`,
      );
    }

    this.logger.log(`Eclipse createPayment success: status=${response.status}`);

    return data;
  }

  async listPayments(params?: {
    walletId?: string;
    limit?: number;
    offset?: number;
  }) {
    const query: string[] = [];
    if (params?.walletId) {
      query.push(`walletId=${encodeURIComponent(params.walletId)}`);
    }
    if (params?.limit !== undefined) {
      query.push(`limit=${params.limit}`);
    }
    if (params?.offset !== undefined) {
      query.push(`offset=${params.offset}`);
    }
    const qs = query.length ? `?${query.join('&')}` : '';
    const url = this.conductorUrl(
      `/tenants/${this.cfg.tenantId}/payments${qs}`,
    );
    const headers = await this.authedHeaders();
    this.logger.log(`Eclipse listPayments -> ${url}`);
    const response = await fetch(url, { headers });
    const bodyText = await response.text();
    const data = bodyText ? this.tryParseArray(bodyText) : [];

    if (!response.ok) {
      this.logger.error(
        `Eclipse listPayments failed: status=${response.status} ${response.statusText || ''} body=${
          bodyText || '<empty>'
        }`,
      );
      throw new Error(
        `Eclipse listPayments failed with status ${response.status}: ${bodyText || response.statusText}`,
      );
    }

    return data;
  }

  async listReservations(params: {
    walletId: string;
    limit?: number;
    offset?: number;
  }) {
    const walletId = params.walletId;
    const limit = params.limit ?? 25;
    const offset = params.offset ?? 0;
    const headers = await this.authedHeaders();

    const candidates = [
      this.conductorUrl(
        `/tenants/${this.cfg.tenantId}/wallets/${encodeURIComponent(
          walletId,
        )}/reservations?limit=${limit}&offset=${offset}`,
      ),
      this.conductorUrl(
        `/tenants/${this.cfg.tenantId}/reservations?walletId=${encodeURIComponent(
          walletId,
        )}&limit=${limit}&offset=${offset}`,
      ),
    ];

    let lastError: string | null = null;
    for (const url of candidates) {
      this.logger.log(`Eclipse listReservations -> ${url}`);
      const response = await fetch(url, { headers });
      const bodyText = await response.text();

      if (!response.ok) {
        lastError = `status=${response.status} ${response.statusText || ''} body=${
          bodyText || '<empty>'
        }`;
        continue;
      }

      if (!bodyText) {
        return [];
      }

      const parsed = this.tryParseArray(bodyText);
      if (parsed.length === 0) {
        this.logger.error(
          `Eclipse listReservations: failed to parse response JSON (status ${response.status})`,
          bodyText,
        );
      }
      return parsed;
    }

    throw new Error(
      `Eclipse listReservations failed: ${lastError ?? 'Unknown error'}`,
    );
  }

  /**
   * Transfer between wallets (tenant fee collection).
   */
  async transferBetweenWallets(params: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/transfers`;
    const headers = await this.authedHeaders();
    const payload = {
      sourceWalletId: params.sourceWalletId,
      destinationWalletId: params.destinationWalletId,
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
    };
    this.logger.log(
      `Eclipse transfer: ${payload.amount} ${payload.currency} ${payload.sourceWalletId} -> ${payload.destinationWalletId} meta=${JSON.stringify(
        payload.metadata,
      )}`,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Eclipse transfer failed: ${response.status} ${body}`);
    }
    return this.ensureRecord(await response.json());
  }

  /**
   * Fetch payment status/details.
   */
  async getPayment(paymentId: string | number) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/payments/${paymentId}`;
    const headers = await this.authedHeaders();
    this.logger.log(`Eclipse getPayment -> ${url}`);
    const response = await fetch(url, { headers });
    const bodyText = await response.text();
    const data = bodyText ? this.tryParseObject(bodyText) : {};

    if (!response.ok) {
      this.logger.error(
        `Eclipse getPayment failed: status=${response.status} ${response.statusText || ''} body=${
          bodyText || '<empty>'
        }`,
      );
      throw new Error(
        `Eclipse getPayment failed with status ${response.status}: ${bodyText || response.statusText}`,
      );
    }

    return data;
  }

  /**
   * Initiate a withdrawal (e.g., ZA_PAYCORP_ATM, ZA_PNP_CASH, EFT).
   */
  async createWithdrawal(request: EclipseWithdrawalRequest) {
    const url = `${this.cfg.apiBase.replace(/\/$/, '')}/tenants/${this.cfg.tenantId}/wallets/${request.walletId}/withdrawals`;
    const headers = await this.authedHeaders();
    const payload = {
      ...request,
      amount:
        typeof (request as EclipseWithdrawalRequest | undefined)?.amount ===
        'number'
          ? { currency: 'ZAR', value: Number(request.amount) }
          : request.amount,
      callbackUrl: this.cfg.callbackBase
        ? `${this.cfg.callbackBase.replace(/\/$/, '')}/webhooks/eclipse/withdrawals`
        : undefined,
    };
    this.logger.log(
      `Eclipse createWithdrawal -> ${url} payload=${JSON.stringify({
        ...payload,
        callbackUrl: !!payload.callbackUrl,
      })}`,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const bodyText = await response.text();
    const data = bodyText ? this.tryParseObject(bodyText) : {};
    if (!response.ok) {
      this.logger.error(
        `Eclipse createWithdrawal failed: status=${response.status} ${response.statusText || ''} body=${
          bodyText || '<empty>'
        } payload=${JSON.stringify({ ...payload, callbackUrl: !!payload.callbackUrl })}`,
      );
      throw new Error(
        `Eclipse createWithdrawal failed with status ${response.status}: ${bodyText || response.statusText}`,
      );
    }
    this.logger.log(
      `Eclipse createWithdrawal success: status=${response.status} payload=${JSON.stringify(
        {
          ...payload,
          callbackUrl: !!payload.callbackUrl,
        },
      )} responseSnippet=${bodyText?.slice(0, 200) ?? '<empty>'}`,
    );
    return data ?? { raw: bodyText ?? '' };
  }

  /**
   * Create a wallet for a guard/customer and return the Eclipse wallet id.
   */
  async createWallet(request: EclipseWalletRequest) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/wallets`;
    const headers = await this.authedHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    return this.ensureRecord(await response.json());
  }

  async createCustomer(request: EclipseCustomerRequest) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/customers`;
    const headers = await this.authedHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    return this.ensureRecord(await response.json());
  }

  /**
   * Best-effort metadata sync (endpoint shape depends on Eclipse tenant config).
   * If Eclipse rejects the request, callers should treat it as non-fatal.
   */
  async updateCustomerMetadata(
    customerId: string,
    metadata: Record<string, any>,
  ) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/customers/${customerId}`;
    const headers = await this.authedHeaders();
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ metadata }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Eclipse updateCustomerMetadata failed: status=${response.status} ${body}`,
      );
    }
    const text = await response.text();
    try {
      return text ? this.tryParseObject(text) : {};
    } catch {
      return { raw: text } as Record<string, unknown>;
    }
  }

  async createCustomerWallet(
    customerId: string,
    request: EclipseCustomerWalletRequest,
  ) {
    const url = `${this.cfg.apiBase.replace(
      /\/$/,
      '',
    )}/tenants/${this.cfg.tenantId}/customers/${customerId}/wallets`;
    const headers = await this.authedHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    return this.ensureRecord(await response.json());
  }

  async getWallet(walletId: string | number) {
    const url = this.conductorUrl(
      `/tenants/${this.cfg.tenantId}/wallets/${walletId}`,
    );
    const headers = await this.authedHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Eclipse getWallet failed: ${response.status} ${body}`);
    }
    return this.ensureRecord(await response.json());
  }

  /**
   * Verify webhook signature (placeholder; implement per Eclipse spec).
   */
  verifyWebhookSignature(rawBody: string, signature?: string): boolean {
    if (!this.cfg.webhookSecret) {
      this.logger.warn('Webhook secret not configured; skipping verification.');
      return true;
    }
    if (!signature) {
      this.logger.warn('Missing webhook signature header.');
      return false;
    }

    try {
      // Eclipse docs typically use HMAC-SHA256 of the raw request body.
      // Accept common formats: "sha256=...", hex, or base64.
      const provided = signature.replace(/^sha256=/i, '').trim();
      const hmac = crypto
        .createHmac('sha256', this.cfg.webhookSecret)
        .update(rawBody, 'utf8')
        .digest();

      const expectedHex = hmac.toString('hex');
      const expectedBase64 = hmac.toString('base64');

      const ok =
        provided === expectedHex ||
        provided === expectedHex.toLowerCase() ||
        provided === expectedBase64;

      if (!ok) {
        this.logger.warn(
          `Webhook signature mismatch. provided=${signature}, expectedHex=${expectedHex}`,
        );
      }
      return ok;
    } catch (err) {
      this.logger.error(
        `Webhook signature verification error: ${(err as Error).message}`,
      );
      return false;
    }
  }

  private ensureRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private ensureArrayOfRecords(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }

  private tryParseObject(text: string): Record<string, unknown> {
    try {
      const parsed: unknown = JSON.parse(text);
      return this.ensureRecord(parsed);
    } catch {
      return {};
    }
  }

  private tryParseArray(text: string): Record<string, unknown>[] {
    try {
      const parsed: unknown = JSON.parse(text);
      return this.ensureArrayOfRecords(parsed);
    } catch {
      return [];
    }
  }
}
