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
import sharp from 'sharp';

@Injectable()
export class StorageService {
  private readonly bucketName: string;
  private readonly kycBucketName: string;
  private readonly qrBucketName: string;
  private readonly kmsKeyId?: string;

  constructor(
    @Inject(S3Client) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucketName =
      this.config.get<string>('USER_ASSETS_BUCKET') ??
      'pashashapay-user-assets';
    this.kycBucketName =
      this.config.get<string>('KYC_ASSETS_BUCKET') ?? this.bucketName;
    this.qrBucketName =
      this.config.get<string>('QR_ASSETS_BUCKET') ?? this.bucketName;
    this.kmsKeyId =
      this.config.get<string>('USER_ASSETS_KMS_KEY_ID') ?? undefined;
  }

  resolveBucketForKey(key: string, overrideBucket?: string) {
    if (overrideBucket) return overrideBucket;
    if (key.startsWith('qr/')) return this.qrBucketName;
    if (key.startsWith('kyc/')) return this.kycBucketName;
    return this.bucketName;
  }

  private encryptionHeaders():
    | { ServerSideEncryption?: 'AES256' | 'aws:kms'; SSEKMSKeyId?: string }
    | undefined {
    if (this.kmsKeyId) {
      return { ServerSideEncryption: 'aws:kms', SSEKMSKeyId: this.kmsKeyId };
    }
    return { ServerSideEncryption: 'AES256' };
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
    bucketOverride?: string,
  ) {
    const bucket = this.resolveBucketForKey(key, bucketOverride);
    const input: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...this.encryptionHeaders(),
    };
    await this.s3.send(new PutObjectCommand(input));
    return {
      bucket,
      key,
      url: `https://${bucket}.s3.${process.env.AWS_REGION ?? 'eu-west-1'}.amazonaws.com/${key}`,
    };
  }

  async deleteObject(key: string, bucketOverride?: string) {
    const bucket = this.resolveBucketForKey(key, bucketOverride);
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async createPresignedUrl(
    key: string,
    contentType: string,
    expires = 900,
    bucketOverride?: string,
  ) {
    const bucket = this.resolveBucketForKey(key, bucketOverride);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: expires,
    });
    return { uploadUrl, key, bucket };
  }

  async createDownloadUrl(key: string, expires = 300, bucketOverride?: string) {
    const bucket = this.resolveBucketForKey(key, bucketOverride);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: expires,
    });
    return { url, key, bucket };
  }

  async getObject(key: string, bucketOverride?: string) {
    const bucket = this.resolveBucketForKey(key, bucketOverride);
    const result = await this.s3.send(
      new GetObjectCommand({
        Bucket: bucket,
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
      bucket,
    };
  }

  private async streamToBuffer(stream: Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<
      Buffer | Uint8Array | string
    >) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(Buffer.from(chunk));
      }
    }
    return Buffer.concat(chunks);
  }

  async sanitizeImageObject(
    key: string,
    contentType: string,
    bucketOverride?: string,
  ) {
    const normalized = contentType.toLowerCase().split(';')[0].trim();
    if (!normalized.startsWith('image/')) return undefined;

    const object = await this.getObject(key, bucketOverride);
    const buffer = await this.streamToBuffer(object.body);

    const pipeline = sharp(buffer, { failOnError: true }).rotate();
    const targetType = normalized === 'image/png' ? 'image/png' : 'image/jpeg';
    const sanitizedBuffer = await (normalized === 'image/png'
      ? pipeline
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer()
      : pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer());

    const uploaded = await this.uploadBuffer(
      key,
      sanitizedBuffer,
      targetType,
      bucketOverride ?? object.bucket,
    );

    return {
      bucket: uploaded.bucket,
      key: uploaded.key,
      contentType: targetType,
      size: sanitizedBuffer.length,
    };
  }
}
