import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3Client,
      useFactory: () => {
        const region = process.env.AWS_REGION ?? 'eu-west-1';
        return new S3Client({ region });
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
