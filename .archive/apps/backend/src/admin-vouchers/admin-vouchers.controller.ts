import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { IngestShopriteCheckersVoucherDto } from './dto/ingest-shoprite-checkers.dto';
import { AdminVouchersService } from './admin-vouchers.service';

@Controller('admin/vouchers')
export class AdminVouchersController {
  constructor(private readonly service: AdminVouchersService) {}

  @Roles('Administrators')
  @Get()
  listRecentVouchers(@Query('limit') limit?: string) {
    return this.service.listRecentVouchers(Number(limit ?? '25'));
  }

  @Roles('Administrators')
  @Post('suppliers/shoprite-checkers/ingest')
  ingestShopriteCheckersVoucher(
    @Body() dto: IngestShopriteCheckersVoucherDto,
    @CurrentUser()
    actor?: { sub?: string; email?: string; ['cognito:groups']?: string[] },
  ) {
    return this.service.ingestShopriteCheckersSms({
      smsText: dto.smsText,
      actor: actor ?? {},
      source: 'web-admin-console',
    });
  }
}
