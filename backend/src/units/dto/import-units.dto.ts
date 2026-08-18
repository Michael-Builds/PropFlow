import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ImportUnitsDto {
  @ApiPropertyOptional({ description: 'Raw CSV text if not uploading a file' })
  @IsOptional()
  @IsString()
  csv?: string;
}
