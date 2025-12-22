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
      const eclipseCustomer = await this.eclipse.createCustomer({
        firstName: dto.firstName,
        lastName: dto.familyName,
        email: dto.email,
        phone1: dto.phoneNumber ?? '',
        externalUniqueId: dto.customerId,
      });
      eclipseCustomerId =
        eclipseCustomer?.customerId?.toString?.() ?? `${dto.customerId}`;

      if (!eclipseCustomerId) {
        throw new Error('Failed to create Eclipse customer');
      }

      const wallet = await this.eclipse.createCustomerWallet(
        eclipseCustomerId,
        {
          walletTypeId: 121924,
          name: `${dto.firstName} ${dto.familyName}`,
          externalUniqueId: dto.customerId,
          status: 'ACTIVE',
          currency: 'ZAR',
        },
      );
      eclipseWalletId = wallet?.walletId?.toString?.() ?? undefined;
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
        (updates as any)[key] = value;
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
    const wallet = await this.eclipse.getWallet(customer.eclipseWalletId);
    const parseAmount = (value: any): number | undefined => {
      if (value === undefined || value === null) {
        return undefined;
      }
      const direct = Number(value);
      if (!Number.isNaN(direct)) return direct;
      const match = value.toString().match(/-?[\d.,]+/);
      if (!match) return undefined;
      const normalized = Number(match[0].replace(/,/g, ''));
      return Number.isNaN(normalized) ? undefined : normalized;
    };

    const pickFirst = (values: any[]) =>
      values.find((v) => v !== undefined && v !== null);

    const availableRaw = pickFirst([
      wallet?.availableBalance?.value,
      wallet?.availableBalance,
      wallet?.balanceAmountAvailable,
    ]);
    const currentRaw = pickFirst([
      wallet?.currentBalance?.value,
      wallet?.currentBalance,
      wallet?.balance?.value,
      wallet?.balance,
      wallet?.walletBalance,
      wallet?.walletBalanceValue,
      wallet?.balanceAmount,
      wallet?.currentBalanceAmount,
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
      currency: wallet?.currency ?? 'ZAR',
    };
  }
}
