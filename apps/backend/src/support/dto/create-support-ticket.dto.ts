import { Transform } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSupportTicketDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Transform(trim)
  message?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Transform(trim)
  summary?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  @Transform(trim)
  details?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  issueType?: string;

  @IsString()
  @IsOptional()
  @Transform(trim)
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Transform(trim)
  supportCode?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
