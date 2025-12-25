import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @Query('userId') userId: string | undefined,
    @Query('eventType') eventType: string | undefined,
    @Query('limit') limitRaw: string | undefined,
    @CurrentUser()
    user: { sub?: string; ['cognito:groups']?: string[] } = {},
  ) {
    const limit = limitRaw ? Number(limitRaw) : undefined;
    return this.audit.search(
      { userId: userId || undefined, eventType: eventType || undefined, limit },
      { sub: user?.sub, groups: user?.['cognito:groups'] },
    );
  }
}
