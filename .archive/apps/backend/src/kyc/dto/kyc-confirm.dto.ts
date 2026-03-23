import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const MAX_KYC_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class KycConfirmDto {
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsInt()
  @Min(1)
  @Max(MAX_KYC_FILE_SIZE_BYTES)
  size!: number;
}
