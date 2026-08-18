import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty()
  @IsString()
  unitId: string;

  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-08-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Defaults to the unit rent' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  rentAmount?: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @ApiPropertyOptional({ enum: ['monthly', 'quarterly'] })
  @IsOptional()
  @IsIn(['monthly', 'quarterly'])
  billingCycle?: 'monthly' | 'quarterly';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
