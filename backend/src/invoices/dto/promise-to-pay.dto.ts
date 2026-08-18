import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class PromiseToPayDto {
  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  promiseToPayAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  promisedAmount?: number;
}
