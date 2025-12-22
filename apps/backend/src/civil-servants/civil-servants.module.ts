import { Module } from '@nestjs/common';
import { CivilServantsController } from './civil-servants.controller';
import { CivilServantsService } from './civil-servants.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { GuardsModule } from '../guards/guards.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentsModule } from '../payments/payments.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [
    ProfilesModule,
    GuardsModule,
    StorageModule,
    PaymentsModule,
    KycModule,
  ],
  controllers: [CivilServantsController],
  providers: [CivilServantsService],
  exports: [CivilServantsService],
})
export class CivilServantsModule {}
