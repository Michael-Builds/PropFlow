import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Airport Hills Estates' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'owner@estates.app' })
  @IsEmail()
  ownerEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerFullName?: string;

  @ApiPropertyOptional({ description: 'Temporary password. Generated if omitted.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  ownerPassword?: string;
}
