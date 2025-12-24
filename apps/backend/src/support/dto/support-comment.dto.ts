import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SupportCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(trim)
  message!: string;
}
