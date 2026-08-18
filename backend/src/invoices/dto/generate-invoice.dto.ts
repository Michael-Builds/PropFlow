import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty()
  @IsString()
  leaseId: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({ example: '2026-09-05' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Defaults to the lease rent amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
