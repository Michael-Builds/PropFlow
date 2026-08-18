import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'success', 'failed', 'abandoned'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['in', 'out'] })
  @IsOptional()
  @IsIn(['in', 'out'])
  direction?: 'in' | 'out';
}
