import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string, page = 1, pageSize = 25) {
    return this.prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  create(params: {
    orgId: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
    ip?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }
}
