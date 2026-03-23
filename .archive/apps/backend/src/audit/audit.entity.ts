export interface AuditLogEntry {
  auditId: string;
  userId: string;
  actorId?: string;
  actorType?: string;
  eventType: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
