import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupportService } from './support.service';
import type { SupportUser } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketsQueryDto } from './dto/support-tickets-query.dto';
import { SupportCommentDto } from './dto/support-comment.dto';
import { SupportStatusDto } from './dto/support-status.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('prepare')
  async prepare(@CurrentUser() user: SupportUser) {
    return this.support.prepareTicket(user);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets')
  async createTicket(
    @CurrentUser() user: SupportUser,
    @Body() body: CreateSupportTicketDto,
  ) {
    return this.support.createTicket(user, body);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('tickets')
  async listTickets(
    @CurrentUser() user: SupportUser,
    @Query() query: SupportTicketsQueryDto,
  ) {
    const items = await this.support.listTickets(user, query.status);
    return { items };
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Get('tickets/:supportCode')
  async getTicket(
    @CurrentUser() user: SupportUser,
    @Param('supportCode') supportCode: string,
  ) {
    return this.support.getTicketForUser(user, supportCode);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets/:supportCode/comments')
  async addComment(
    @CurrentUser() user: SupportUser,
    @Param('supportCode') supportCode: string,
    @Body() body: SupportCommentDto,
  ) {
    return this.support.addComment(user, supportCode, body?.message);
  }

  @Roles('Customers', 'CivilServants', 'Administrators')
  @Post('tickets/:supportCode/status')
  async updateStatusUser(
    @CurrentUser() user: SupportUser,
    @Param('supportCode') supportCode: string,
    @Body() body: SupportStatusDto,
  ) {
    return this.support.updateStatus(user, supportCode, body?.status ?? '');
  }

  // Admin endpoints
  @Roles('Administrators')
  @Get('admin/tickets')
  async adminList(@Query() query: SupportTicketsQueryDto) {
    return this.support.listTicketsAdmin({
      status: query.status,
      supportCode: query.supportCode,
      familyName: query.familyName,
    });
  }

  @Roles('Administrators')
  @Get('admin/tickets/:supportCode')
  async adminGet(@Param('supportCode') supportCode: string) {
    return this.support.getTicket(supportCode);
  }

  @Roles('Administrators')
  @Post('admin/tickets/:supportCode/comments')
  async adminComment(
    @CurrentUser() user: SupportUser,
    @Param('supportCode') supportCode: string,
    @Body() body: SupportCommentDto,
  ) {
    return this.support.addComment(user, supportCode, body?.message);
  }

  @Roles('Administrators')
  @Post('admin/tickets/:supportCode/status')
  async adminStatus(
    @CurrentUser() user: SupportUser,
    @Param('supportCode') supportCode: string,
    @Body() body: SupportStatusDto,
  ) {
    return this.support.updateStatus(user, supportCode, body?.status ?? '');
  }
}
