import { Module } from '@nestjs/common';
import { DynamoConfigModule } from '../config/dynamo.config';
import { ConfigModule } from '@nestjs/config';
import { AccountNumberService } from './account-number.service';
import { CustomerRepository } from './customer.repository';
import { CivilServantRepository } from './civil-servant.repository';
import { AdministratorRepository } from './administrator.repository';

@Module({
  imports: [ConfigModule, DynamoConfigModule],
  providers: [
    AccountNumberService,
    CustomerRepository,
    CivilServantRepository,
    AdministratorRepository,
  ],
  exports: [
    AccountNumberService,
    CustomerRepository,
    CivilServantRepository,
    AdministratorRepository,
  ],
})
export class ProfilesModule {}
