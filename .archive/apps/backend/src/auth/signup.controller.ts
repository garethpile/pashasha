import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from './public.decorator';
import { SignupDto } from './dto/signup.dto';
import { SignupService } from './signup.service';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { CustomerRepository } from '../profiles/customer.repository';
import { EmailQueryDto } from '../common/dto/email-query.dto';

@Controller('auth')
export class SignupController {
  constructor(
    private readonly signup: SignupService,
    private readonly civilServants: CivilServantRepository,
    private readonly customers: CustomerRepository,
  ) {}

  @Public()
  @Throttle({ login: { limit: 5, ttl: 60 } })
  @Post('signup')
  async handleSignup(@Body() dto: SignupDto) {
    return this.signup.signup(dto);
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60 } })
  @Get('check-email')
  async checkEmail(@Query() query: EmailQueryDto) {
    const normalized = query.email.toLowerCase();
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
