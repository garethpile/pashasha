import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [ProfilesModule, StorageModule, PaymentsModule],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
