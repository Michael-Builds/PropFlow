import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pageArgs, pageResult } from '../common/pagination';
import { documentStatus } from '../common/document-status';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, query: ListDocumentsQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where: Prisma.DocumentWhereInput = {
      orgId,
      ...(query.entityType ? { entityType: query.entityType as Prisma.EnumEntityTypeFilter['equals'] } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.docType ? { docType: query.docType } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.document.count({ where }),
    ]);
    const items = rows.map((row) => this.present(row));
    return pageResult(
      page,
      pageSize,
      total,
      query.status ? items.filter((item) => item.status === query.status) : items,
    );
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.document.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Document not found.');
    return this.present(row);
  }

  async create(orgId: string, dto: CreateDocumentDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    const row = await this.prisma.document.create({
      data: {
        orgId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        docType: dto.docType,
        fileUrl: dto.fileUrl,
        expiresAt,
        status: documentStatus(expiresAt),
      },
    });
    return this.present(row);
  }

  async update(orgId: string, id: string, dto: UpdateDocumentDto) {
    await this.getById(orgId, id);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const row = await this.prisma.document.update({
      where: { id },
      data: {
        ...(dto.entityType != null ? { entityType: dto.entityType } : {}),
        ...(dto.entityId != null ? { entityId: dto.entityId } : {}),
        ...(dto.docType != null ? { docType: dto.docType } : {}),
        ...(dto.fileUrl != null ? { fileUrl: dto.fileUrl } : {}),
        ...(expiresAt !== undefined ? { expiresAt, status: documentStatus(expiresAt) } : {}),
      },
    });
    return this.present(row);
  }

  async remove(orgId: string, id: string) {
    await this.getById(orgId, id);
    await this.prisma.document.delete({ where: { id } });
    return { ok: true };
  }

  present(row: {
    id: string;
    orgId: string;
    entityType: string;
    entityId: string;
    docType: string;
    fileUrl: string;
    expiresAt: Date | null;
    status: string;
    metadataJson: Prisma.JsonValue;
    createdAt: Date;
  }) {
    const status = documentStatus(row.expiresAt);
    return {
      id: row.id,
      orgId: row.orgId,
      entityType: row.entityType,
      entityId: row.entityId,
      type: row.docType,
      docType: row.docType,
      fileUrl: row.fileUrl,
      expiresAt: row.expiresAt,
      status,
      metadataJson: row.metadataJson,
      createdAt: row.createdAt,
    };
  }
}
