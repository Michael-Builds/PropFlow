import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { ListBlocksQueryDto } from './dto/list-blocks-query.dto';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  list(@OrgId() orgId: string, @Query() query: ListBlocksQueryDto) {
    return this.blocksService.list(orgId, query);
  }

  @Post()
  create(@OrgId() orgId: string, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(orgId, dto);
  }

  @Get(':id')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.blocksService.getById(orgId, id);
  }

  @Patch(':id')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.blocksService.update(orgId, id, dto);
  }
}
