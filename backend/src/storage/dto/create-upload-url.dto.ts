import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty()
  @IsString()
  fileName: string;

  @ApiProperty()
  @IsString()
  contentType: string;
}
