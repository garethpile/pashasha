import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateSandboxTopupDto {
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
}
