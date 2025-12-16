import { CreateTipIntentPayload, GuardProfile, GuardsClientOptions, TipIntent } from './types.js';

const DEFAULT_BASE_URL = '/api/guards';

export class GuardsClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: GuardsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async getGuard(token: string, init?: RequestInit): Promise<GuardProfile> {
    return this.request<GuardProfile>(`/${token}`, {
      method: 'GET',
      ...init,
    });
  }

  async createTipIntent(
    token: string,
    payload: CreateTipIntentPayload,
    init?: RequestInit
  ): Promise<TipIntent> {
    return this.request<TipIntent>(`/${token}/tips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      body: JSON.stringify({ guardToken: token, ...payload }),
      ...init,
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.resolveUrl(path);
    const response = await this.fetchFn(url, {
      credentials: 'include',
      cache: init.cache ?? 'no-store',
      ...init,
      headers: {
        ...this.defaultHeaders,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorBody: unknown = null;

      try {
        errorBody = await response.json();
      } catch {
        // Response body is not JSON
      }

      const error = new Error(`Request to ${url} failed with status ${status} (${statusText})`);
      Object.assign(error, { status, statusText, body: errorBody });
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private resolveUrl(path: string): string {
    const trimmedBase = this.baseUrl.replace(/\/+$/, '');
    const trimmedPath = path.replace(/^\/+/, '');
    return `${trimmedBase}/${trimmedPath}`;
  }
}
