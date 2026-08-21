import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Airport Hills Estates' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'owner@estates.app' })
  @IsEmail()
  ownerEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerFullName?: string;

  @ApiPropertyOptional({ example: '+233241234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}
