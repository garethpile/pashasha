import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';
import { CustomerRepository } from '../profiles/customer.repository';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import {
  KycDocumentRecord,
  KycDocumentType,
  KycProfileType,
  KycRecord,
  KycStatus,
} from './kyc.types';
import { EclipseService } from '../payments/eclipse.service';
import { MAX_KYC_FILE_SIZE_BYTES } from './dto/kyc-confirm.dto';

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

function extFromContentType(contentType: string) {
  const normalized = contentType.toLowerCase().split(';')[0].trim();
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  return 'bin';
}

function sanitizeFileName(value?: string) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return undefined;
  const withoutPath = trimmed.split(/[/\\]/).pop() ?? trimmed;
  return withoutPath.replace(/[^\w.\-() ]+/g, '_').slice(0, 120);
}

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly customers: CustomerRepository,
    private readonly civilServants: CivilServantRepository,
    private readonly storage: StorageService,
    private readonly eclipse: EclipseService,
  ) {}

  private async loadProfile(profileType: KycProfileType, profileId: string) {
    if (profileType === 'customer') {
      const entity = await this.customers.get(profileId);
      if (!entity) throw new NotFoundException('Customer not found');
      return entity;
    }
    const entity = await this.civilServants.get(profileId);
    if (!entity) throw new NotFoundException('Civil servant not found');
    return entity;
  }

  private async saveKyc(
    profileType: KycProfileType,
    profileId: string,
    kyc: KycRecord,
  ) {
    if (profileType === 'customer') {
      await this.customers.update(profileId, { kyc });
      return;
    }
    await this.civilServants.update(profileId, { kyc });
  }

  async getKyc(profileType: KycProfileType, profileId: string) {
    const entity = await this.loadProfile(profileType, profileId);
    const kyc = entity.kyc;
    return (
      kyc ?? {
        status: 'not_started' as const,
        documents: {},
        updatedAt: entity.updatedAt ?? new Date().toISOString(),
      }
    );
  }

  async createPresignedUpload(
    profileType: KycProfileType,
    profileId: string,
    documentType: KycDocumentType,
    contentType: string,
    fileName?: string,
    size?: number,
  ) {
    const normalized = contentType.toLowerCase().split(';')[0].trim();
    if (!ALLOWED_CONTENT_TYPES.has(normalized)) {
      throw new BadRequestException(
        `Unsupported content type. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
      );
    }

    if (size && size > MAX_KYC_FILE_SIZE_BYTES) {
      throw new BadRequestException('Requested file exceeds permitted size');
    }

    await this.loadProfile(profileType, profileId);

    const ext = extFromContentType(normalized);
    const safeName = sanitizeFileName(fileName);
    const key = `kyc/${profileType}/${profileId}/${documentType}/${randomUUID()}${
      safeName ? `-${safeName}` : ''
    }.${ext}`;

    return this.storage.createPresignedUrl(key, normalized, 15 * 60);
  }

  async confirmUpload(
    profileType: KycProfileType,
    profileId: string,
    documentType: KycDocumentType,
    record: Omit<KycDocumentRecord, 'uploadedAt'>,
  ) {
    const entity = await this.loadProfile(profileType, profileId);

    const expectedPrefix = `kyc/${profileType}/${profileId}/${documentType}/`;
    if (!record.key.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Invalid document key for this profile/document type',
      );
    }

    if (!ALLOWED_CONTENT_TYPES.has(record.contentType)) {
      throw new BadRequestException(
        `Unsupported content type. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
      );
    }

    if (!record.size || record.size > MAX_KYC_FILE_SIZE_BYTES) {
      throw new BadRequestException('Uploaded file exceeds permitted size');
    }

    const resolvedBucket = this.storage.resolveBucketForKey(
      record.key,
      record.bucket,
    );
    if (record.bucket && record.bucket !== resolvedBucket) {
      throw new BadRequestException('Bucket does not match document key');
    }

    let sanitized = record;
    if (record.contentType.startsWith('image/')) {
      const result = await this.storage.sanitizeImageObject(
        record.key,
        record.contentType,
        resolvedBucket,
      );
      if (result) {
        sanitized = {
          ...sanitized,
          bucket: result.bucket,
          contentType: result.contentType,
          size: result.size,
        };
      }
    }

    const now = new Date().toISOString();
    const existing = entity.kyc;

    const previousStatus = existing?.status ?? ('not_started' as const);
    const nextStatus: KycStatus =
      previousStatus === 'approved' || previousStatus === 'rejected'
        ? 'pending'
        : previousStatus === 'not_started'
          ? 'pending'
          : 'pending';

    const kyc: KycRecord = {
      status: nextStatus,
      documents: { ...(existing?.documents ?? {}) },
      updatedAt: now,
    };
    kyc.documents[documentType] = {
      ...sanitized,
      bucket: resolvedBucket,
      uploadedAt: now,
    };

    await this.saveKyc(profileType, profileId, kyc);

    const eclipseCustomerId = entity.eclipseCustomerId;
    if (eclipseCustomerId) {
      try {
        await this.eclipse.updateCustomerMetadata(eclipseCustomerId, {
          kycStatus: kyc.status,
          kycUpdatedAt: kyc.updatedAt,
          kycDocuments: Object.fromEntries(
            Object.entries(kyc.documents).map(([type, doc]) => [
              type,
              doc
                ? {
                    bucket: doc.bucket,
                    key: doc.key,
                    contentType: doc.contentType,
                  }
                : null,
            ]),
          ),
        });
      } catch (error) {
        this.logger.warn(
          `Failed to sync KYC metadata to Eclipse for ${profileType}/${profileId} (eclipseCustomerId=${eclipseCustomerId}): ${
            (error as Error).message
          }`,
        );
      }
    }

    return kyc;
  }

  async createDownloadUrl(
    profileType: KycProfileType,
    profileId: string,
    documentType: KycDocumentType,
  ) {
    const entity = await this.loadProfile(profileType, profileId);
    const kyc = entity.kyc;
    const doc = kyc?.documents?.[documentType];
    if (!doc?.key) {
      throw new NotFoundException('KYC document not found');
    }
    return this.storage.createDownloadUrl(doc.key, 5 * 60, doc.bucket);
  }

  async getDocument(
    profileType: KycProfileType,
    profileId: string,
    documentType: KycDocumentType,
  ) {
    const entity = await this.loadProfile(profileType, profileId);
    const doc = entity.kyc?.documents?.[documentType];
    if (!doc?.key) {
      throw new NotFoundException('KYC document not found');
    }
    const object = await this.storage.getObject(doc.key, doc.bucket);
    return {
      stream: object.body,
      contentType:
        doc.contentType || object.contentType || 'application/octet-stream',
      fileName: doc.fileName,
      contentLength: object.contentLength,
    };
  }

  async deleteDocument(
    profileType: KycProfileType,
    profileId: string,
    documentType: KycDocumentType,
  ) {
    const entity = await this.loadProfile(profileType, profileId);
    const existing = entity.kyc;
    const doc = existing?.documents?.[documentType];
    if (!doc?.key) {
      throw new NotFoundException('KYC document not found');
    }

    // Best-effort S3 cleanup; do not fail the request if deletion errors.
    try {
      await this.storage.deleteObject(doc.key, doc.bucket);
    } catch (error) {
      this.logger.warn(
        `Failed to delete KYC object ${doc.key}: ${(error as Error).message}`,
      );
    }

    const updatedDocs = { ...(existing?.documents ?? {}) };
    delete updatedDocs[documentType];

    const hasAnyDocs = Object.values(updatedDocs).some(Boolean);
    const nextStatus: KycStatus = hasAnyDocs
      ? (existing?.status ?? 'pending')
      : 'not_started';

    const now = new Date().toISOString();
    const kyc: KycRecord = {
      status: nextStatus,
      documents: updatedDocs,
      updatedAt: now,
    };

    await this.saveKyc(profileType, profileId, kyc);

    const eclipseCustomerId = entity.eclipseCustomerId;
    if (eclipseCustomerId) {
      try {
        await this.eclipse.updateCustomerMetadata(eclipseCustomerId, {
          kycStatus: kyc.status,
          kycUpdatedAt: kyc.updatedAt,
          kycDocuments: Object.fromEntries(
            Object.entries(kyc.documents).map(([type, document]) => [
              type,
              document
                ? {
                    bucket: document.bucket,
                    key: document.key,
                    contentType: document.contentType,
                  }
                : null,
            ]),
          ),
        });
      } catch (error) {
        this.logger.warn(
          `Failed to sync KYC metadata to Eclipse for ${profileType}/${profileId} (eclipseCustomerId=${eclipseCustomerId}): ${
            (error as Error).message
          }`,
        );
      }
    }

    return kyc;
  }
}
