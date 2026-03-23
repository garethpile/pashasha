import { IsString, MaxLength, MinLength } from 'class-validator';

export class IngestShopriteCheckersVoucherDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  smsText!: string;
}
