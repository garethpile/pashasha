import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60,
        limit: 10,
      },
    ]),
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
