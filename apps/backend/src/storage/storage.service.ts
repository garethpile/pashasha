import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly bucketName: string;
  private readonly kmsKeyId?: string;

  constructor(
    @Inject(S3Client) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucketName =
      this.config.get<string>('USER_ASSETS_BUCKET') ??
      'pashashapay-user-assets';
    this.kmsKeyId =
      this.config.get<string>('USER_ASSETS_KMS_KEY_ID') ?? undefined;
  }

  private encryptionHeaders():
    | { ServerSideEncryption?: 'AES256' | 'aws:kms'; SSEKMSKeyId?: string }
    | undefined {
    if (this.kmsKeyId) {
      return { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: this.kmsKeyId };
    }
    return { ServerSideEncryption: 'AES256' };
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string) {
    const input: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...this.encryptionHeaders(),
    };
    await this.s3.send(new PutObjectCommand(input));
    return {
      bucket: this.bucketName,
      key,
      url: `https://${this.bucketName}.s3.${process.env.AWS_REGION ?? 'eu-west-1'}.amazonaws.com/${key}`,
    };
  }

  async deleteObject(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  async createPresignedUrl(key: string, contentType: string, expires = 900) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expires,
    });
    return { uploadUrl, key, bucket: this.bucketName };
  }

  async createDownloadUrl(key: string, expires = 300) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: expires,
    });
    return { url, key, bucket: this.bucketName };
  }

  async getObject(key: string) {
    const result = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    const body = result.Body;
    if (!body) {
      throw new Error('S3 object body is empty');
    }

    // In Node.js, Body is a readable stream.
    return {
      body: body as unknown as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  }
}
