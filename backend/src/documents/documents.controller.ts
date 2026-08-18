import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrgId } from '../auth/decorators/org-id.decorator';
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
  @Roles('owner', 'manager', 'finance', 'tenant')
  list(@OrgId() orgId: string, @Query() query: ListDocumentsQueryDto) {
    return this.documentsService.list(orgId, query);
  }

  @Post('upload-url')
  @Roles('owner', 'manager', 'finance')
  createUploadUrl(@Body() body: CreateUploadUrlDto) {
    return this.storageService.createUploadUrl(body);
  }

  @Post()
  @Roles('owner', 'manager', 'finance')
  create(@OrgId() orgId: string, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(orgId, dto);
  }

  @Get(':id')
  get(@OrgId() orgId: string, @Param('id') id: string) {
    return this.documentsService.getById(orgId, id);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'finance')
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.documentsService.remove(orgId, id);
  }
}
