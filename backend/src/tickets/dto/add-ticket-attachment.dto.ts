import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddTicketAttachmentDto {
  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: 'Original file name or label' })
  @IsString()
  fileName: string;
}
