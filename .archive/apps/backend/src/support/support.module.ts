import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoConfigModule } from '../config/dynamo.config';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [ConfigModule, DynamoConfigModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
