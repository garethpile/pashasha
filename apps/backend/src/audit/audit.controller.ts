import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuditQueryDto } from './dto/audit-query.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @Query() query: AuditQueryDto,
    @CurrentUser()
    user: { sub?: string; ['cognito:groups']?: string[] } = {},
  ) {
    return this.audit.search(query, {
      sub: user?.sub,
      groups: user?.['cognito:groups'],
    });
  }
}
