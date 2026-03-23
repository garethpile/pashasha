import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  Matches,
} from 'class-validator';

export class CreateTipIntentDto {
  @IsString()
  guardToken!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(2000)
  amount!: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/i, {
    message: 'currency must be a 3-letter ISO code',
  })
  currency: string = 'ZAR';

  @IsOptional()
  @IsString()
  clientReference?: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  yourReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  theirReference?: string;
}
