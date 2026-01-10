import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from '../profiles/customer.repository';
import { AccountNumberService } from '../profiles/account-number.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { EclipseService } from '../payments/eclipse.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly accountNumbers: AccountNumberService,
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
  ) {}

  async create(dto: CreateCustomerDto) {
    const now = new Date().toISOString();
    const accountNumber =
      await this.accountNumbers.nextAccountNumber('CUSTOMER');

    let eclipseCustomerId = dto.eclipseCustomerId;
    let eclipseWalletId = dto.eclipseWalletId;

    // If Eclipse IDs are not provided, create them in Eclipse.
    if (!eclipseCustomerId || !eclipseWalletId) {
      const eclipseCustomerRaw = await this.eclipse.createCustomer({
        firstName: dto.firstName,
        lastName: dto.familyName,
        email: dto.email,
        phone1: dto.phoneNumber ?? '',
        externalUniqueId: dto.customerId,
      });
      const eclipseCustomer = this.ensureRecord(eclipseCustomerRaw);
      const customerIdValue = this.stringFrom(
        eclipseCustomer.customerId ?? dto.customerId,
      );
      eclipseCustomerId = customerIdValue ?? `${dto.customerId}`;

      if (!eclipseCustomerId) {
        throw new Error('Failed to create Eclipse customer');
      }

      const walletRaw = await this.eclipse.createCustomerWallet(
        eclipseCustomerId,
        {
          walletTypeId: 121924,
          name: `${dto.firstName} ${dto.familyName}`,
          externalUniqueId: dto.customerId,
          status: 'ACTIVE',
          currency: 'ZAR',
        },
      );
      const wallet = this.ensureRecord(walletRaw);
      eclipseWalletId = this.stringFrom(wallet.walletId);
    }

    const entity = {
      customerId: dto.customerId,
      accountNumber,
      firstName: dto.firstName,
      familyName: dto.familyName,
      familyNameUpper: dto.familyName.toUpperCase(),
      email: dto.email,
      emailLower: dto.email.toLowerCase(),
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      cognitoUsername: dto.cognitoUsername,
      eclipseCustomerId,
      eclipseWalletId,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.put(entity);
  }

  async findAll(limit?: number) {
    return this.repository.list(limit);
  }

  async findOne(customerId: string) {
    const result = await this.repository.get(customerId);
    if (!result) {
      throw new NotFoundException('Customer not found');
    }
    return result;
  }

  async search(accountNumber?: string, familyName?: string) {
    if (accountNumber) {
      return this.repository.findByAccountNumber(accountNumber);
    }
    if (familyName) {
      return this.repository.findByFamilyName(familyName);
    }
    return this.findAll();
  }

  async findByUser(customerId: string) {
    return this.findOne(customerId);
  }

  async listTransactions(
    customerId: string,
    limit = 10,
    offset = 0,
    options?: { statusFilter?: 'successful' | 'pending' | 'all' },
  ) {
    const customer = await this.findOne(customerId);
    if (!customer.eclipseWalletId) {
      return [];
    }
    return this.payments.listByWalletId(
      customer.eclipseWalletId,
      limit,
      offset,
      options,
    );
  }

  async listSentTransactions(customerId: string, limit = 10, offset = 0) {
    const customer = await this.findOne(customerId);
    const eclipseCustomerId = customer.eclipseCustomerId;
    if (!eclipseCustomerId) {
      return [];
    }
    return this.payments.listByCustomerId(eclipseCustomerId, limit, offset);
  }

  async update(customerId: string, dto: UpdateCustomerDto) {
    await this.findOne(customerId);
    await this.repository.update(customerId, dto);
    return this.findOne(customerId);
  }

  async updateSelf(customerId: string, dto: UpdateCustomerDto) {
    await this.findOne(customerId);
    const allowed: (keyof UpdateCustomerDto)[] = [
      'firstName',
      'familyName',
      'phoneNumber',
      'email',
      'address',
    ];
    const updates: Partial<UpdateCustomerDto> = {};
    for (const key of allowed) {
      const value = dto[key];
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length === 0) {
      return this.findOne(customerId);
    }
    await this.repository.update(customerId, updates);
    return this.findOne(customerId);
  }

  async remove(customerId: string) {
    await this.findOne(customerId);
    await this.repository.delete(customerId);
  }

  async getWalletInfo(customerId: string) {
    const customer = await this.findOne(customerId);
    if (!customer.eclipseWalletId) {
      throw new NotFoundException('Wallet not linked for this customer');
    }
    let walletRaw: unknown;
    try {
      walletRaw = await this.eclipse.getWallet(customer.eclipseWalletId);
    } catch (err) {
      const message = (err as Error)?.message ?? '';
      if (/Eclipse getWallet failed:\s*404\b/i.test(message)) {
        throw new NotFoundException('Wallet not found for this customer');
      }
      throw err;
    }
    const wallet = this.ensureRecord(walletRaw);
    const parseAmount = (value: unknown): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const match = value.match(/-?[\d.,]+/);
        if (!match) return undefined;
        const normalized = Number(match[0].replace(/,/g, ''));
        return Number.isNaN(normalized) ? undefined : normalized;
      }
      return undefined;
    };

    const pickFirst = <T>(values: T[]) =>
      values.find((value) => value !== undefined && value !== null);

    const read = (key: string, nested?: string) => {
      const value = wallet[key];
      if (!nested) return value;
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[nested];
      }
      return undefined;
    };

    const availableRaw = pickFirst([
      read('availableBalance', 'value'),
      read('availableBalance'),
      read('balanceAmountAvailable'),
    ]);
    const currentRaw = pickFirst([
      read('currentBalance', 'value'),
      read('currentBalance'),
      read('balance', 'value'),
      read('balance'),
      read('walletBalance'),
      read('walletBalanceValue'),
      read('balanceAmount'),
      read('currentBalanceAmount'),
    ]);

    const availableBalance = parseAmount(availableRaw);
    const currentBalance = parseAmount(currentRaw);
    let balance = availableBalance ?? currentBalance;

    if (balance === undefined && customer.eclipseWalletId) {
      try {
        const tx = await this.payments.listByWalletId(
          customer.eclipseWalletId,
          50,
          0,
        );
        const withBalance = tx.find(
          (t) =>
            t.balance !== undefined &&
            t.balance !== null &&
            Number(t.balance) !== 0,
        );
        if (withBalance?.balance !== undefined) {
          balance = Number(withBalance.balance) || 0;
        } else {
          const derived = tx.reduce(
            (sum, record) => sum + Number(record.amount ?? 0),
            0,
          );
          balance = derived || 0;
        }
      } catch {
        // keep balance undefined if derivation fails
      }
    }

    return {
      walletId: customer.eclipseWalletId,
      balance: balance ?? 0,
      availableBalance: availableBalance ?? balance ?? 0,
      currentBalance: currentBalance ?? balance ?? 0,
      currency: typeof wallet.currency === 'string' ? wallet.currency : 'ZAR',
    };
  }

  private ensureRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private stringFrom(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return undefined;
  }
}
