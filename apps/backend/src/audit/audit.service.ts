import { Injectable, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditRepository } from './audit.repository';
import { AuditLogEntry } from './audit.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async record(entry: {
    userId: string;
    actorId?: string;
    actorType?: string;
    eventType: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntry> {
    const now = new Date().toISOString();
    const item: AuditLogEntry = {
      auditId: randomUUID(),
      createdAt: now,
      ...entry,
    };
    return this.repo.put(item);
  }

  async search(
    params: AuditQueryDto,
    actor: { sub?: string; groups?: string[] },
  ): Promise<AuditLogEntry[]> {
    const limit = Math.max(1, Math.min(params.limit ?? 50, 200));
    const groups = actor.groups ?? [];
    const isAdmin = groups.some((g) =>
      ['administrators', 'admin'].includes(
        g.toLowerCase().replace(/[\s_-]/g, ''),
      ),
    );

    if (!isAdmin) {
      const userId = actor.sub;
      if (!userId) {
        throw new ForbiddenException('Missing subject for audit lookup');
      }
      return this.repo.queryByUser(userId, limit);
    }

    if (params.userId) {
      return this.repo.queryByUser(params.userId, limit);
    }
    if (params.eventType) {
      return this.repo.queryByType(params.eventType, limit);
    }
    return this.repo.listRecent(limit);
  }
}
