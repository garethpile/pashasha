import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('prepare')
  async prepare(@CurrentUser() user: any) {
    return this.support.prepareTicket(user);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets')
  async createTicket(
    @CurrentUser() user: any,
    @Body()
    body: {
      message?: string;
      summary?: string;
      details?: string;
      issueType?: string;
      status?: string;
      supportCode?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.support.createTicket(user, body);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('tickets')
  async listTickets(
    @CurrentUser() user: any,
    @Query('status') status?: string,
  ) {
    const items = await this.support.listTickets(user, status);
    return { items };
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('tickets/:supportCode')
  async getTicket(
    @CurrentUser() user: any,
    @Param('supportCode') supportCode: string,
  ) {
    return this.support.getTicketForUser(user, supportCode);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets/:supportCode/comments')
  async addComment(
    @CurrentUser() user: any,
    @Param('supportCode') supportCode: string,
    @Body() body: { message?: string },
  ) {
    return this.support.addComment(user, supportCode, body?.message);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets/:supportCode/status')
  async updateStatusUser(
    @CurrentUser() user: any,
    @Param('supportCode') supportCode: string,
    @Body() body: { status?: string },
  ) {
    return this.support.updateStatus(user, supportCode, body?.status ?? '');
  }

  // Admin endpoints
  @Roles('Administrators')
  @Get('admin/tickets')
  async adminList(
    @Query('status') status?: string,
    @Query('supportCode') supportCode?: string,
    @Query('familyName') familyName?: string,
  ) {
    return this.support.listTicketsAdmin({ status, supportCode, familyName });
  }

  @Roles('Administrators')
  @Get('admin/tickets/:supportCode')
  async adminGet(@Param('supportCode') supportCode: string) {
    return this.support.getTicket(supportCode);
  }

  @Roles('Administrators')
  @Post('admin/tickets/:supportCode/comments')
  async adminComment(
    @CurrentUser() user: any,
    @Param('supportCode') supportCode: string,
    @Body() body: { message?: string },
  ) {
    return this.support.addComment(user, supportCode, body?.message);
  }

  @Roles('Administrators')
  @Post('admin/tickets/:supportCode/status')
  async adminStatus(
    @CurrentUser() user: any,
    @Param('supportCode') supportCode: string,
    @Body() body: { status?: string },
  ) {
    return this.support.updateStatus(user, supportCode, body?.status ?? '');
  }
}
