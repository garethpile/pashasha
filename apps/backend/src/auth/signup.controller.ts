import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from './public.decorator';
import { SignupDto } from './dto/signup.dto';
import { SignupService } from './signup.service';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { CustomerRepository } from '../profiles/customer.repository';

@Controller('auth')
export class SignupController {
  constructor(
    private readonly signup: SignupService,
    private readonly civilServants: CivilServantRepository,
    private readonly customers: CustomerRepository,
  ) {}

  @Public()
  @Post('signup')
  async handleSignup(@Body() dto: SignupDto) {
    return this.signup.signup(dto);
  }

  @Public()
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const value = email?.trim();
    if (!value) {
      throw new BadRequestException('email query parameter is required');
    }
    const normalized = value.toLowerCase();
    const [civil, customer] = await Promise.all([
      this.civilServants.findByEmail(normalized),
      this.customers.findByEmail(normalized),
    ]);
    return {
      exists: civil.length > 0 || customer.length > 0,
      type:
        civil.length > 0
          ? 'civil-servant'
          : customer.length > 0
            ? 'customer'
            : undefined,
    };
  }
}
