import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pageArgs, pageResult } from '../common/pagination';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, query: PaginationQueryDto) {
    const { page, pageSize, skip, take } = pageArgs(query.page, query.pageSize);
    const where = { orgId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      this.prisma.vendor.count({ where }),
    ]);
    return pageResult(page, pageSize, total, rows);
  }

  async getById(orgId: string, id: string) {
    const row = await this.prisma.vendor.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Vendor not found.');
    return row;
  }

  create(orgId: string, dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: { orgId, name: dto.name, status: dto.status ?? 'active' },
    });
  }

  async update(orgId: string, id: string, dto: UpdateVendorDto) {
    await this.getById(orgId, id);
    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name } : {}),
        ...(dto.status != null ? { status: dto.status } : {}),
      },
    });
  }
}
