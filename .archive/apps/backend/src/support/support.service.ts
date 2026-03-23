import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Inject } from '@nestjs/common';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';

export type SupportUser = {
  sub?: string;
  username?: string;
  cognitoUsername?: string;
  email?: string;
  phone_number?: string;
  phoneNumber?: string;
  given_name?: string;
  family_name?: string;
  firstName?: string;
  lastName?: string;
  'custom:firstName'?: string;
  'custom:lastName'?: string;
  'cognito:groups'?: string[];
};

type SupportMetadata = {
  email?: string;
  phone?: string;
  phoneNumber?: string;
  accountNumber?: string;
  walletId?: string;
  profileType?: string;
  firstName?: string;
  familyName?: string;
  [key: string]: unknown;
};

type SupportComment = {
  id: string;
  authorType: 'user' | 'admin';
  authorId: string;
  authorName: string;
  message: string;
  createdAt: string;
};

type SupportTicket = {
  supportCode: string;
  customerId: string;
  status: 'ACTIVE' | 'CLOSED';
  summary: string;
  details?: string;
  issueType: string;
  createdAt: string;
  updatedAt: string;
  user: ReturnType<SupportService['buildUserInfo']>;
  firstName?: string;
  familyName?: string;
  username?: string;
  cognitoId?: string;
  comments: SupportComment[];
};

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly topicArn?: string;
  private readonly tableName: string;
  private readonly counterTable: string;
  private readonly client: SNSClient;

  constructor(
    private readonly config: ConfigService,
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
  ) {
    this.topicArn =
      process.env.SUPPORT_TOPIC_ARN ??
      this.config.get<string>('SUPPORT_TOPIC_ARN');
    this.tableName =
      process.env.SUPPORT_TABLE_NAME ??
      this.config.get<string>('SUPPORT_TABLE_NAME') ??
      'Pashasha-Support';
    this.counterTable =
      process.env.COUNTER_TABLE_NAME ??
      this.config.get<string>('COUNTER_TABLE_NAME') ??
      'Pashasha-account-counters';
    this.client = new SNSClient({});
  }

  private buildUserInfo(user: SupportUser, metadata?: SupportMetadata) {
    const givenName =
      metadata?.firstName ??
      user?.given_name ??
      user?.['custom:firstName'] ??
      user?.firstName;
    const familyName =
      metadata?.familyName ??
      user?.family_name ??
      user?.['custom:lastName'] ??
      user?.lastName;
    return {
      sub: user?.sub,
      email: metadata?.email ?? user?.email,
      username: user?.username ?? user?.cognitoUsername,
      groups: user?.['cognito:groups'] ?? [],
      phone:
        metadata?.phone ??
        metadata?.phoneNumber ??
        user?.phone_number ??
        user?.phoneNumber,
      firstName: givenName,
      familyName,
      accountNumber: metadata?.accountNumber,
      walletId: metadata?.walletId,
      profileType: metadata?.profileType,
    };
  }

  private isAdmin(user: SupportUser) {
    const groups = user?.['cognito:groups'] ?? [];
    return groups.some((g) => g?.toLowerCase() === 'administrators');
  }

  private normalizeStatus(status?: string) {
    if (!status) return undefined;
    const upper = status.toUpperCase();
    return upper === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
  }

  private userDisplayName(info: ReturnType<SupportService['buildUserInfo']>) {
    const parts = [info?.firstName, info?.familyName].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return info?.email ?? info?.username ?? 'User';
  }

  async nextSupportCode(): Promise<string> {
    const result = await this.dynamo.send(
      new UpdateCommand({
        TableName: this.counterTable,
        Key: { pk: 'SUPPORT_COUNTER', sk: 'SUPPORT' },
        UpdateExpression: 'ADD #value :inc',
        ExpressionAttributeNames: { '#value': 'value' },
        ExpressionAttributeValues: { ':inc': 1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    const counter = Number(result.Attributes?.value ?? 1);
    return `SUPP-${String(counter).padStart(8, '0')}`;
  }

  async prepareTicket(user: SupportUser) {
    const supportCode = await this.nextSupportCode();
    const userInfo = this.buildUserInfo(user);
    return { supportCode, user: userInfo };
  }

  private async persistTicket(ticket: SupportTicket): Promise<SupportTicket> {
    try {
      await this.dynamo.send(
        new PutCommand({
          TableName: this.tableName,
          Item: ticket,
          ConditionExpression: 'attribute_not_exists(supportCode)',
        }),
      );
      return ticket;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        // extremely unlikely collision, try again with a new code
        const code = await this.nextSupportCode();
        return this.persistTicket({ ...ticket, supportCode: code });
      }
      throw error;
    }
  }

  async createTicket(
    user: SupportUser,
    payload: {
      message?: string;
      summary?: string;
      details?: string;
      issueType?: string;
      status?: string;
      supportCode?: string;
      metadata?: SupportMetadata;
    },
  ) {
    const summary = payload?.summary?.trim() ?? payload?.message?.trim();
    if (!summary) {
      throw new BadRequestException('summary is required');
    }
    const details = payload?.details?.trim();
    const issueType = payload?.issueType ?? 'Account';

    const supportCode = payload?.supportCode ?? (await this.nextSupportCode());
    const now = new Date().toISOString();
    const userInfo = this.buildUserInfo(user, payload?.metadata);
    const customerId = user?.sub ?? user?.username ?? '';

    const ticket: SupportTicket = {
      supportCode,
      customerId,
      status: this.normalizeStatus(payload?.status) ?? 'ACTIVE',
      summary,
      details,
      issueType,
      createdAt: now,
      updatedAt: now,
      user: userInfo,
      firstName: userInfo.firstName,
      familyName: userInfo.familyName,
      username: userInfo.username,
      cognitoId: userInfo.sub ?? userInfo.username,
      comments: [
        {
          id: `${supportCode}-initial`,
          authorType: 'user',
          authorId: user?.sub ?? user?.username ?? '',
          authorName: this.userDisplayName(userInfo),
          message: summary,
          createdAt: now,
        },
      ],
    };

    const saved = await this.persistTicket(ticket);
    await this.publishIssue(summary, userInfo, supportCode);
    return saved;
  }

  async listTickets(user: SupportUser, status?: string) {
    const customerId = user?.sub ?? user?.username ?? '';
    const normalizedStatus = this.normalizeStatus(status);
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'byCustomer',
        KeyConditionExpression: 'customerId = :cid',
        ExpressionAttributeValues: { ':cid': customerId },
      }),
    );

    const items = (result.Items ?? []).map((item) => item as SupportTicket);
    const filtered = items.filter((item) => {
      if (!normalizedStatus) return true;
      return item.status === normalizedStatus;
    });
    return filtered.sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
    );
  }

  async listTicketsAdmin(filters: {
    status?: string;
    supportCode?: string;
    familyName?: string;
  }) {
    const normalizedStatus = this.normalizeStatus(filters.status);
    const result = await this.dynamo.send(
      new ScanCommand({
        TableName: this.tableName,
      }),
    );
    const items = (result.Items ?? []).map((item) => item as SupportTicket);
    const filtered = items.filter((item) => {
      if (normalizedStatus && item.status !== normalizedStatus) return false;
      if (
        filters.supportCode &&
        !String(item.supportCode ?? '').includes(filters.supportCode)
      ) {
        return false;
      }
      if (filters.familyName) {
        const target = (item.user?.familyName ?? '').toString().toLowerCase();
        if (!target.includes(filters.familyName.toLowerCase())) return false;
      }
      return true;
    });
    return filtered.sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
    );
  }

  async getTicketForUser(user: SupportUser, supportCode: string) {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { supportCode },
      }),
    );
    const ticket = result.Item as SupportTicket | undefined;
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if ((user?.sub ?? user?.username) !== ticket.customerId) {
      throw new ForbiddenException('Not allowed');
    }
    return ticket;
  }

  async getTicket(supportCode: string) {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { supportCode },
      }),
    );
    const ticket = result.Item as SupportTicket | undefined;
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async addComment(user: SupportUser, supportCode: string, message?: string) {
    const content = message?.trim();
    if (!content) {
      throw new BadRequestException('message is required');
    }
    const admin = this.isAdmin(user);
    const ticket = admin
      ? await this.getTicket(supportCode)
      : await this.getTicketForUser(user, supportCode);
    const now = new Date().toISOString();
    const userInfo = this.buildUserInfo(user);
    const comment: SupportComment = {
      id: `${supportCode}-${now}`,
      authorType: admin ? 'admin' : 'user',
      authorId: user?.sub ?? user?.username ?? '',
      authorName: admin ? 'Pashasha Support' : this.userDisplayName(userInfo),
      message: content,
      createdAt: now,
    };

    await this.dynamo.send(
      new UpdateCommand(
        admin
          ? {
              TableName: this.tableName,
              Key: { supportCode },
              UpdateExpression:
                'SET comments = list_append(if_not_exists(comments, :emptyList), :comment), updatedAt = :updated',
              ExpressionAttributeValues: {
                ':comment': [comment],
                ':emptyList': [],
                ':updated': now,
              },
            }
          : {
              TableName: this.tableName,
              Key: { supportCode },
              ConditionExpression: 'customerId = :cid',
              UpdateExpression:
                'SET comments = list_append(if_not_exists(comments, :emptyList), :comment), updatedAt = :updated',
              ExpressionAttributeValues: {
                ':cid': ticket.customerId,
                ':comment': [comment],
                ':emptyList': [],
                ':updated': now,
              },
            },
      ),
    );

    return {
      ...ticket,
      comments: [...(ticket.comments ?? []), comment],
      updatedAt: now,
    };
  }

  async updateStatus(user: SupportUser, supportCode: string, status: string) {
    const normalized = this.normalizeStatus(status);
    if (!normalized) {
      throw new BadRequestException('status must be Active or Closed');
    }
    const ticket = await this.getTicket(supportCode);
    const isOwner = (user?.sub ?? user?.username) === ticket.customerId;
    if (!isOwner && !this.isAdmin(user)) {
      throw new ForbiddenException('Not allowed');
    }
    const updatedAt = new Date().toISOString();
    await this.dynamo.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { supportCode },
        UpdateExpression: 'SET #status = :status, updatedAt = :updated',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': normalized,
          ':updated': updatedAt,
        },
      }),
    );
    return { ...ticket, status: normalized, updatedAt };
  }

  async publishIssue(
    message: string,
    userInfo: ReturnType<SupportService['buildUserInfo']>,
    supportCode?: string,
  ) {
    if (!this.topicArn) {
      this.logger.warn('Support topic ARN not configured; skipping publish');
      return;
    }
    const payload = {
      supportCode,
      message,
      user: userInfo,
      timestamp: new Date().toISOString(),
    };
    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: 'Pashasha Support Issue',
        Message: JSON.stringify(payload, null, 2),
      }),
    );
  }
}
