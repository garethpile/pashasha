import { Module } from '@nestjs/common';
import { GuardsController } from './guards.controller';
import { GuardsService } from './guards.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [ProfilesModule, PaymentsModule],
  controllers: [GuardsController],
  providers: [GuardsService],
  exports: [GuardsService],
})
export class GuardsModule {}
