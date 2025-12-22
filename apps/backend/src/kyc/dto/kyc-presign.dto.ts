import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class KycPresignDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}
