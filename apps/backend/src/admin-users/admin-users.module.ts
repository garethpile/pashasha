import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { CustomersModule } from '../customers/customers.module';
import { CivilServantsModule } from '../civil-servants/civil-servants.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UserProvisioningService } from '../auth/user-provisioning.service';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    CustomersModule,
    CivilServantsModule,
    WorkflowsModule,
    ProfilesModule,
  ],
  controllers: [AdminUsersController],
  providers: [UserProvisioningService],
})
export class AdminUsersModule {}
