import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { EclipseService } from './eclipse.service';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { DynamoConfigModule } from '../config/dynamo.config';
import { PaymentWorkflowService } from './payment-workflow.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [DynamoConfigModule, ProfilesModule],
  controllers: [PaymentsController],
  providers: [
    EclipseService,
    PaymentsRepository,
    PaymentsService,
    PaymentWorkflowService,
  ],
  exports: [EclipseService, PaymentsService, PaymentWorkflowService],
})
export class PaymentsModule {}
