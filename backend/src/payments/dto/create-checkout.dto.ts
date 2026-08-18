import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @ApiPropertyOptional({ description: 'Invoice id (requires a signed-in operator)' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Public checkout token from invoice.payUrl' })
  @IsOptional()
  @IsString()
  token?: string;
}
