import { Injectable, NotFoundException } from '@nestjs/common';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { AccountNumberService } from '../profiles/account-number.service';
import { CreateCivilServantDto } from './dto/create-civil-servant.dto';
import { UpdateCivilServantDto } from './dto/update-civil-servant.dto';
import { randomUUID } from 'crypto';
import { GuardsService } from '../guards/guards.service';
import { StorageService } from '../storage/storage.service';
import { EclipseService } from '../payments/eclipse.service';
import { PaymentsService } from '../payments/payments.service';
import { CivilServantEntity } from '../profiles/entities/civil-servant.entity';

@Injectable()
export class CivilServantsService {
  constructor(
    private readonly repository: CivilServantRepository,
    private readonly accountNumbers: AccountNumberService,
    private readonly guardsService: GuardsService,
    private readonly storage: StorageService,
    private readonly eclipse: EclipseService,
    private readonly payments: PaymentsService,
  ) {}

  async create(dto: CreateCivilServantDto) {
    const now = new Date().toISOString();
    const entity = {
      civilServantId: dto.civilServantId,
      accountNumber:
        await this.accountNumbers.nextAccountNumber('CIVIL_SERVANT'),
      firstName: dto.firstName,
      familyName: dto.familyName,
      familyNameUpper: dto.familyName.toUpperCase(),
      email: dto.email,
      emailLower: dto.email.toLowerCase(),
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      homeAddress: dto.homeAddress,
      primarySite: dto.primarySite,
      occupation: dto.occupation,
      cognitoUsername: dto.cognitoUsername,
      status: 'active' as const,
      eclipseCustomerId: dto.eclipseCustomerId,
      eclipseWalletId: dto.eclipseWalletId,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.put(entity);
  }

  async findOne(civilServantId: string) {
    const result = await this.repository.get(civilServantId);
    if (!result) {
      throw new NotFoundException('Civil servant not found');
    }
    return result;
  }

  async findByUser(civilServantId: string) {
    return this.findOne(civilServantId);
  }

  async search(accountNumber?: string, familyName?: string) {
    if (accountNumber) {
      return this.repository.findByAccountNumber(accountNumber);
    }
    if (familyName) {
      return this.repository.findByFamilyName(familyName);
    }
    return this.repository.list();
  }

  async searchForCustomers(filters: {
    firstName?: string;
    familyName?: string;
    occupation?: string;
    site?: string;
  }) {
    const all = await this.repository.list();
    const { firstName, familyName, occupation, site } = filters;
    const normalize = (value?: string | null) =>
      (value ?? '').toString().toLowerCase();

    return all
      .filter((item) => Boolean(item.guardToken))
      .filter((item) => {
        if (
          firstName &&
          !normalize(item.firstName).includes(normalize(firstName))
        ) {
          return false;
        }
        if (
          familyName &&
          !normalize(item.familyName).includes(normalize(familyName))
        ) {
          return false;
        }
        if (occupation) {
          const occ =
            (item as any)?.occupation ?? (item as any)?.metadata?.occupation;
          if (!normalize(occ).includes(normalize(occupation))) {
            return false;
          }
        }
        if (site) {
          const primarySite = (item as any)?.primarySite ?? item.address;
          if (!normalize(primarySite).includes(normalize(site))) {
            return false;
          }
        }
        return true;
      })
      .map((item) => ({
        civilServantId: item.civilServantId,
        firstName: item.firstName,
        familyName: item.familyName,
        occupation:
          (item as any)?.occupation ??
          (item as any)?.metadata?.occupation ??
          'Civil Servant',
        primarySite: (item as any)?.primarySite ?? item.address ?? '',
        guardToken: item.guardToken,
        accountNumber: item.accountNumber,
        status: item.status ?? 'active',
      }));
  }

  async update(civilServantId: string, dto: UpdateCivilServantDto) {
    await this.findOne(civilServantId);
    await this.repository.update(civilServantId, dto);
    return this.findOne(civilServantId);
  }

  async updateSelf(civilServantId: string, dto: UpdateCivilServantDto) {
    await this.findOne(civilServantId);
    const allowed: (keyof UpdateCivilServantDto)[] = [
      'firstName',
      'familyName',
      'phoneNumber',
      'email',
      'address',
      'homeAddress',
      'primarySite',
      'occupation',
    ];
    const updates: Partial<CivilServantEntity> = {};
    for (const key of allowed) {
      const value = dto[key];
      if (value !== undefined) {
        // Map primarySite to address if address not provided explicitly for backward compatibility
        if (key === 'primarySite') {
          updates.primarySite = value;
          if (!dto.address && !updates.address) {
            updates.address = value;
          }
        } else {
          (updates as any)[key] = value;
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return this.findOne(civilServantId);
    }
    await this.repository.update(civilServantId, updates);
    return this.findOne(civilServantId);
  }

  async remove(civilServantId: string) {
    await this.findOne(civilServantId);
    await this.repository.delete(civilServantId);
  }

  async regenerateGuardToken(civilServantId: string) {
    const guard = await this.findOne(civilServantId);
    const newToken = randomUUID().replace(/-/g, '').slice(0, 16);
    const { buffer } = await this.guardsService.generateGuardQrCode(
      newToken,
      true,
    );
    const key = `qr/${civilServantId}/${newToken}.png`;
    await this.storage.uploadBuffer(key, buffer, 'image/png');
    await this.repository.update(civilServantId, {
      guardToken: newToken,
      qrCodeKey: key,
    });
    return this.findOne(civilServantId);
  }

  async createPresignedUpload(
    civilServantId: string,
    type: 'photo' | 'idDocument',
    contentType: string,
  ) {
    const key = `profiles/${civilServantId}/${type}-${Date.now()}`;
    const result = await this.storage.createPresignedUrl(key, contentType, 900);
    await this.repository.update(civilServantId, {
      [`${type}Key`]: key,
    });
    return result;
  }

  async getQrCodeUrl(civilServantId: string) {
    const servant = await this.findOne(civilServantId);
    if (!servant.qrCodeKey) {
      throw new NotFoundException('QR code not generated');
    }
    return this.storage.createDownloadUrl(servant.qrCodeKey, 300);
  }

  async getQrCodeForUser(civilServantId: string) {
    return this.getQrCodeUrl(civilServantId);
  }

  async getPayoutInfo(civilServantId: string) {
    const servant = await this.findOne(civilServantId);
    if (!servant.eclipseWalletId) {
      throw new NotFoundException('Wallet not linked for this civil servant');
    }
    const wallet = await this.eclipse.getWallet(servant.eclipseWalletId);
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

    // Prefer availableBalance if provided (even if zero). Otherwise fall back to current.
    let balance = availableBalance ?? currentBalance;

    // Fallback: if the provider does not return a usable balance, derive it from transaction history.
    if (balance === undefined && servant.eclipseWalletId) {
      try {
        const tx = await this.payments.listByWalletId(
          servant.eclipseWalletId,
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
      } catch (err) {
        // keep balance at 0 if fallback fails
      }
    }

    return {
      walletId: servant.eclipseWalletId,
      balance: balance ?? 0,
      availableBalance: availableBalance ?? balance ?? 0,
      currentBalance: currentBalance ?? balance ?? 0,
      currency: wallet?.currency ?? 'ZAR',
    };
  }

  async withdraw(
    civilServantId: string,
    amount: number,
    withdrawalType: string,
  ) {
    const servant = await this.findOne(civilServantId);
    if (!servant.eclipseWalletId) {
      throw new NotFoundException('Wallet not linked for this civil servant');
    }
    const wallet = await this.eclipse.getWallet(servant.eclipseWalletId);
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
    const candidates = [
      wallet?.availableBalance?.value,
      wallet?.availableBalance,
      wallet?.currentBalance?.value,
      wallet?.currentBalance,
      wallet?.balance?.value,
      wallet?.balance,
      wallet?.walletBalance,
      wallet?.walletBalanceValue,
      wallet?.balanceAmount,
      wallet?.currentBalanceAmount,
    ];
    const rawBalance = candidates
      .map((c) => parseAmount(c))
      .find((v) => v !== undefined);
    let balance = rawBalance ?? 0;
    if (!balance) {
      try {
        const tx = await this.payments.listByWalletId(servant.eclipseWalletId);
        const derived = tx.reduce(
          (sum, record) => sum + Number(record.amount ?? 0),
          0,
        );
        balance = derived || 0;
      } catch (err) {
        balance = 0;
      }
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (amount > balance) {
      throw new Error('Amount exceeds available balance');
    }

    const withdrawal = await this.payments.createWithdrawalWithFee({
      walletId: servant.eclipseWalletId,
      civilServantId: servant.civilServantId,
      amount,
      currency: wallet?.currency ?? 'ZAR',
      withdrawalType,
      metadata: {
        guardToken: servant.guardToken,
        accountNumber: servant.accountNumber,
        phoneNumber: servant.phoneNumber,
      },
    });

    return {
      withdrawal,
      balanceBefore: balance,
    };
  }
}
