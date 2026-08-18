import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pageArgs, pageResult } from '../common/pagination';
import { CreateBlockDto } from './dto/create-block.dto';
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
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.block.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.block.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows);
  }

  async create(orgId: string, dto: CreateBlockDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, orgId },
    });
    if (!property) throw new NotFoundException('Property not found.');
    return this.prisma.block.create({
      data: {
        orgId,
        propertyId: dto.propertyId,
        name: dto.name,
        status: dto.status ?? 'active',
      },
    });
  }
}
