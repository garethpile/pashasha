import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GuardsModule } from './guards/guards.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DynamoConfigModule } from './config/dynamo.config';
import { ProfilesModule } from './profiles/profiles.module';
import { CustomersModule } from './customers/customers.module';
import { CivilServantsModule } from './civil-servants/civil-servants.module';
import { StorageModule } from './storage/storage.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PaymentsModule } from './payments/payments.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DynamoConfigModule,
    AuthModule,
    ProfilesModule,
    CustomersModule,
    CivilServantsModule,
    StorageModule,
    GuardsModule,
    AdminUsersModule,
    PaymentsModule,
    WorkflowsModule,
    SupportModule,
    HealthModule,
  ],
})
export class AppModule {}
