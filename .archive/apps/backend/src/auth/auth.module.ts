import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { CognitoJwtStrategy } from './cognito.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SignupController } from './signup.controller';
import { SignupService } from './signup.service';
import { CustomersModule } from '../customers/customers.module';
import { CivilServantsModule } from '../civil-servants/civil-servants.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    PassportModule,
    CustomersModule,
    CivilServantsModule,
    WorkflowsModule,
    ProfilesModule,
  ],
  controllers: [SignupController],
  providers: [
    CognitoJwtStrategy,
    SignupService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
