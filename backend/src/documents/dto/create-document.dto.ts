import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ enum: ['property', 'unit', 'tenant', 'lease', 'ticket'] })
  @IsIn(['property', 'unit', 'tenant', 'lease', 'ticket'])
  entityType: 'property' | 'unit' | 'tenant' | 'lease' | 'ticket';

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
