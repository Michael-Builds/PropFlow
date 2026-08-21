import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blockId?: string;

  @ApiProperty()
  @IsString()
  unitCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sqm?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiPropertyOptional({ default: 'GHS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Utility setup, e.g. meters and account numbers',
    example: { electricityMeter: 'EL-001', waterMeter: 'WT-001', prepaid: true },
  })
  @IsOptional()
  @IsObject()
  utilityJson?: Record<string, unknown>;
}
