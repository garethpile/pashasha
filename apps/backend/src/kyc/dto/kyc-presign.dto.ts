import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MAX_KYC_FILE_SIZE_BYTES } from './kyc-confirm.dto';

export class KycPresignDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsInt()
  @Min(1)
  @Max(MAX_KYC_FILE_SIZE_BYTES)
  @IsOptional()
  size?: number;
}
