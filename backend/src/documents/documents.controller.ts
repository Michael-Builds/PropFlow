import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { CreateUploadUrlDto } from '../storage/dto/create-upload-url.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'finance', 'tenant')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query() query: ListDocumentsQueryDto) {
    return this.documentsService.list(user.orgId, query);
  }

  @Post('upload-url')
  @Roles('owner', 'manager', 'finance')
  createUploadUrl(@Body() body: CreateUploadUrlDto) {
    return this.storageService.createUploadUrl(body);
  }

  @Post()
  @Roles('owner', 'manager', 'finance')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(user.orgId, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.documentsService.getById(user.orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'finance')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(user.orgId, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.documentsService.remove(user.orgId, id);
  }
}
