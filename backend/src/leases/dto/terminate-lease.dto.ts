import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TerminateLeaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
