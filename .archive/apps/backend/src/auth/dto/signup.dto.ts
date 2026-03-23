import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  IsEnum,
  ValidateIf,
  Matches,
} from 'class-validator';

export enum SignupRole {
  CUSTOMER = 'CUSTOMER',
  CIVIL_SERVANT = 'CIVIL_SERVANT',
}

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  familyName!: string;

  @ValidateIf((dto: SignupDto) => !dto.phoneNumber)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ValidateIf((dto: SignupDto) => !dto.email)
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(SignupRole)
  role?: SignupRole;

  @ValidateIf((dto: SignupDto) => dto.role !== SignupRole.CUSTOMER)
  @IsString()
  @MinLength(2)
  occupation?: string;

  @ValidateIf((dto: SignupDto) => dto.occupation?.toLowerCase() === 'other')
  @IsString()
  @MinLength(2)
  otherOccupation?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must include upper, lower, and a number',
  })
  password!: string;
}
