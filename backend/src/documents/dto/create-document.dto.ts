import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ enum: ['property', 'unit', 'tenant', 'lease'] })
  @IsIn(['property', 'unit', 'tenant', 'lease'])
  entityType: 'property' | 'unit' | 'tenant' | 'lease';

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty()
  @IsString()
  docType: string;

  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
