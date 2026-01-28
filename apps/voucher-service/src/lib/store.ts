import type {
  LedgerEntry,
  PayoutIntent,
  PayoutResult,
  PayoutStatus,
  RecipientBalance,
  RecipientProfile,
} from './types.js';

export interface PayoutStore {
  createPayout(intent: PayoutIntent): Promise<void>;
  updatePayoutStatus(id: string, status: PayoutStatus, result?: PayoutResult): Promise<void>;
  getPayout(id: string): Promise<PayoutIntent | null>;
  listPayoutsByRecipient(recipientId: string, limit?: number): Promise<PayoutIntent[]>;
  recordEvent(payoutId: string, type: string, payload: Record<string, unknown>): Promise<void>;
  upsertRecipient(recipient: RecipientProfile, providerRef?: string): Promise<void>;
  recordLedgerEntry(entry: LedgerEntry): Promise<void>;
  getRecipientBalance(recipientId: string): Promise<RecipientBalance | null>;
  adjustRecipientBalance(
    recipientId: string,
    delta: number,
    currency: 'ZAR',
    requireAvailable?: boolean
  ): Promise<RecipientBalance>;
}

export class InMemoryPayoutStore implements PayoutStore {
  private payouts = new Map<string, PayoutIntent>();
  private balances = new Map<string, RecipientBalance>();

  async createPayout(intent: PayoutIntent): Promise<void> {
    this.payouts.set(intent.id, intent);
  }

  async updatePayoutStatus(id: string, status: PayoutStatus): Promise<void> {
    const current = this.payouts.get(id);
    if (!current) return;
    this.payouts.set(id, { ...current, status });
  }

  async getPayout(id: string): Promise<PayoutIntent | null> {
    return this.payouts.get(id) ?? null;
  }

  async listPayoutsByRecipient(recipientId: string, limit = 20): Promise<PayoutIntent[]> {
    return Array.from(this.payouts.values())
      .filter((payout) => payout.recipientId === recipientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }

  async recordEvent(): Promise<void> {
    return;
  }

  async upsertRecipient(): Promise<void> {
    return;
  }

  async recordLedgerEntry(): Promise<void> {
    return;
  }

  async getRecipientBalance(recipientId: string): Promise<RecipientBalance | null> {
    return this.balances.get(recipientId) ?? null;
  }

  async adjustRecipientBalance(
    recipientId: string,
    delta: number,
    currency: 'ZAR',
    requireAvailable = false
  ): Promise<RecipientBalance> {
    const existing = this.balances.get(recipientId);
    const next = (existing?.availableBalance ?? 0) + delta;
    if (requireAvailable && next < 0) {
      throw new Error('insufficient balance');
    }
    const now = new Date().toISOString();
    const updated: RecipientBalance = {
      recipientId,
      availableBalance: next,
      currency,
      updatedAt: now,
    };
    this.balances.set(recipientId, updated);
    return updated;
  }
}
