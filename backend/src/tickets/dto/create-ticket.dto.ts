import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'medium' })
  @IsString()
  priority: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
