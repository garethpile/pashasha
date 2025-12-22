import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { PaymentsModule } from '../payments/payments.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [ProfilesModule, PaymentsModule, KycModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
