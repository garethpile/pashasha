import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  familyName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  cognitoUsername?: string;

  @IsOptional()
  @IsString()
  eclipseCustomerId?: string;

  @IsOptional()
  @IsString()
  eclipseWalletId?: string;
}
