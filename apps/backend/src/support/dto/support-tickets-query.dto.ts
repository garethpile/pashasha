import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SupportTicketsQueryDto {
  @IsString()
  @IsOptional()
  @Transform(trim)
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Transform(trim)
  supportCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  familyName?: string;
}
