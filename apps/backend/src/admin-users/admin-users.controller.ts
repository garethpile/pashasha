import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { BaseManagedUserDto } from './dto/base-managed-user.dto';
import { AccountWorkflowService } from '../workflows/account-workflow.service';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { CustomerRepository } from '../profiles/customer.repository';
import { AdministratorRepository } from '../profiles/administrator.repository';

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly workflows: AccountWorkflowService,
    private readonly civilServants: CivilServantRepository,
    private readonly customers: CustomerRepository,
    private readonly administrators: AdministratorRepository,
  ) {}

  @Roles('Administrators')
  @Post('customers')
  async createCustomer(@Body() dto: BaseManagedUserDto) {
    await this.workflows.startAccountWorkflow({
      type: 'customer',
      firstName: dto.firstName,
      familyName: dto.familyName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      profileAlreadyExists: false,
    });
    return { status: 'queued' };
  }

  @Roles('Administrators')
  @Post('civil-servants')
  async createCivilServant(@Body() dto: BaseManagedUserDto) {
    await this.workflows.startAccountWorkflow({
      type: 'civil-servant',
      firstName: dto.firstName,
      familyName: dto.familyName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      profileAlreadyExists: false,
    });
    return { status: 'queued' };
  }

  @Roles('Administrators')
  @Post('administrators')
  async createAdministrator(@Body() dto: BaseManagedUserDto) {
    const username = dto.email?.toLowerCase?.();
    if (!username) {
      throw new BadRequestException('Email is required for administrator');
    }
    const now = new Date().toISOString();
    await this.administrators.put({
      username,
      emailLower: username,
      firstName: dto.firstName,
      familyName: dto.familyName,
      phoneNumber: dto.phoneNumber,
      createdAt: now,
      updatedAt: now,
    });
    await this.workflows.startAccountWorkflow({
      type: 'administrator',
      firstName: dto.firstName,
      familyName: dto.familyName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: dto.password,
      profileAlreadyExists: false,
    });
    return { status: 'queued' };
  }

  @Roles('Administrators')
  @Get('administrators')
  async listAdministrators() {
    return this.administrators.list();
  }

  @Roles('Administrators')
  @Delete('customers/:customerId')
  deleteCustomer(@Param('customerId') _customerId: string) {
    void _customerId;
    throw new Error(
      'Deletion via admin API is currently disabled while workflows own lifecycle.',
    );
  }

  @Roles('Administrators')
  @Delete('civil-servants/:civilServantId')
  deleteCivilServant(@Param('civilServantId') _civilServantId: string) {
    void _civilServantId;
    throw new Error(
      'Deletion via admin API is currently disabled while workflows own lifecycle.',
    );
  }

  @Roles('Administrators')
  @Delete('administrators/:username')
  async deleteAdministrator(@Param('username') username: string) {
    await this.administrators.delete(username);
    return { status: 'deleted' };
  }

  @Roles('Administrators')
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const value = email?.trim();
    if (!value) {
      throw new BadRequestException('email query parameter is required');
    }
    const normalized = value.toLowerCase();
    const [civil, customer, admin] = await Promise.all([
      this.civilServants.findByEmail(normalized),
      this.customers.findByEmail(normalized),
      this.administrators.findByEmail(normalized),
    ]);
    return {
      exists: civil.length > 0 || customer.length > 0 || admin.length > 0,
      type:
        civil.length > 0
          ? 'civil-servant'
          : customer.length > 0
            ? 'customer'
            : admin.length > 0
              ? 'administrator'
              : undefined,
    };
  }
}
