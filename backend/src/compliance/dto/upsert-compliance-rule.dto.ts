import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EntityType } from '../../generated/prisma/client';

export class UpsertComplianceRuleDto {
  @ApiProperty({ enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ example: 'national_id' })
  @IsString()
  @MaxLength(80)
  docType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Expected validity window in days (e.g. 365 for annual certs).' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number | null;
}
