import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  EclipsePaymentType,
  EclipseWithdrawalType,
  EclipseWalletRequest,
} from '../eclipse.types';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class EclipsePaymentDto {
  @IsIn([
    'GLOBAL_PAYMENT_LINK',
    'GLOBAL_QRCODE',
    'GLOBAL_EMVQRCODE',
    'ZA_QRCODE',
    'ZA_OZOW',
  ] as EclipsePaymentType[])
  type!: EclipsePaymentType;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  currency!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  destinationWalletId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  walletId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  customerId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalUniqueId?: string;

  @IsObject()
  @IsOptional()
  paymentData?: Record<string, unknown>;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  callbackUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class EclipseAmountDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  currency!: string;

  @Type(() => Number)
  @IsNumber()
  value!: number;
}

export class EclipseWithdrawalDto {
  @IsIn([
    'ZA_SB_EFT',
    'ZA_NEDBANK_EFT',
    'ZA_NEDBANK_EFT_IMMEDIATE',
    'ZA_PAYCORP_ATM',
    'ZA_PNP_CASH',
  ] as EclipseWithdrawalType[])
  type!: EclipseWithdrawalType;

  @ValidateNested()
  @Type(() => EclipseAmountDto)
  amount!: EclipseAmountDto;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  walletId!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  deliverToPhone?: string;

  @IsObject()
  @IsOptional()
  bankDetails?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class EclipseWalletDto implements EclipseWalletRequest {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalUniqueId?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class ReconcilePaymentsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  days?: number;
}
