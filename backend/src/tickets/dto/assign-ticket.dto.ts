import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;
}
