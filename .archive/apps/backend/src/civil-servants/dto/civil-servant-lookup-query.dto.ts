import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CivilServantLookupQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  familyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  occupation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  @Transform(trim)
  site?: string;
}
