import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class StorageService {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(
    configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.bucket = configService.getOrThrow<string>('AWS_S3_BUCKET');
    this.client = new S3Client({
      region: configService.getOrThrow<string>('AWS_REGION'),
      endpoint: configService.get<string>('AWS_S3_ENDPOINT') || undefined,
      forcePathStyle: configService.get<boolean>('AWS_S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async createUploadUrl(dto: CreateUploadUrlDto) {
    const key = `documents/${Date.now()}-${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 60 * 10,
    });

    this.logger.info(`Created upload URL for ${key}`, StorageService.name);

    return {
      key,
      uploadUrl,
      fileUrl: `s3://${this.bucket}/${key}`,
    };
  }
}
