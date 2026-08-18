import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateLeaseDto } from './create-lease.dto';

export class UpdateLeaseDto extends PartialType(CreateLeaseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
