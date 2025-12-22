import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  size?: number;
}
