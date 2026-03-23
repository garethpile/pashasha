import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DynamoConfigModule } from '../config/dynamo.config';
import { AdminVouchersController } from './admin-vouchers.controller';
import { AdminVoucherRepository } from './admin-voucher.repository';
import { AdminVouchersService } from './admin-vouchers.service';
import { VoucherVaultService } from './voucher-vault.service';

@Module({
  imports: [DynamoConfigModule, AuditModule],
  controllers: [AdminVouchersController],
  providers: [
    AdminVoucherRepository,
    AdminVouchersService,
    VoucherVaultService,
  ],
})
export class AdminVouchersModule {}
