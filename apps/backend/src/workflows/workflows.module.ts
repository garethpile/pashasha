import { Module } from '@nestjs/common';
import { AccountWorkflowService } from './account-workflow.service';

@Module({
  providers: [AccountWorkflowService],
  exports: [AccountWorkflowService],
})
export class WorkflowsModule {}
