import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pageArgs, pageResult } from '../common/pagination';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { ListBlocksQueryDto } from './dto/list-blocks-query.dto';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, query: ListBlocksQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where = {
      orgId,
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.block.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { property: { select: { name: true } } },
      }),
      this.prisma.block.count({ where }),
    ]);
    return pageResult(
      page,
      pageSize,
      total,
      rows.map((row) => ({
        ...row,
        property: row.property.name,
      })),
    );
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.block.findFirst({
      where: { id, orgId },
      include: { property: { select: { name: true } } },
    });
    if (!row) throw new NotFoundException('Block not found.');
    return { ...row, property: row.property.name };
  }

  async create(orgId: string, dto: CreateBlockDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, orgId },
    });
    if (!property) throw new NotFoundException('Property not found.');
    const row = await this.prisma.block.create({
      data: {
        orgId,
        propertyId: dto.propertyId,
        name: dto.name,
        status: dto.status ?? 'active',
      },
      include: { property: { select: { name: true } } },
    });
    return { ...row, property: row.property.name };
  }

  async update(orgId: string, id: string, dto: UpdateBlockDto) {
    await this.getById(orgId, id);
    const row = await this.prisma.block.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
      include: { property: { select: { name: true } } },
    });
    return { ...row, property: row.property.name };
  }
}
