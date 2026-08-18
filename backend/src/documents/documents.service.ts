import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.document.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  create(data: {
    orgId: string;
    entityType: 'property' | 'unit' | 'tenant' | 'lease';
    entityId: string;
    docType: string;
    fileUrl: string;
    expiresAt?: string;
  }) {
    return this.prisma.document.create({
      data: {
        orgId: data.orgId,
        entityType: data.entityType,
        entityId: data.entityId,
        docType: data.docType,
        fileUrl: data.fileUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }
}
