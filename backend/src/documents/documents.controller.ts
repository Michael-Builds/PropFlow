import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { CreateUploadUrlDto } from '../storage/dto/create-upload-url.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  list() {
    return this.documentsService.list('org_demo');
  }

  @Post('upload-url')
  createUploadUrl(@Body() body: CreateUploadUrlDto) {
    return this.storageService.createUploadUrl(body);
  }

  @Post()
  create(@Body() body: any) {
    return this.documentsService.create({ ...body, orgId: 'org_demo' });
  }
}
