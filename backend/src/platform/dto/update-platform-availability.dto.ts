import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlatformAvailabilityMode } from '../../generated/prisma/client';

export { PlatformAvailabilityMode };
export const PLATFORM_AVAILABILITY_MODES = Object.values(PlatformAvailabilityMode);

export class UpdatePlatformAvailabilityDto {
  @ApiProperty({ enum: PlatformAvailabilityMode })
  @IsEnum(PlatformAvailabilityMode)
  mode: PlatformAvailabilityMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'When true, queue in-app alerts for company users entering maintenance/coming_soon.',
  })
  @IsOptional()
  @IsBoolean()
  notifyUsers?: boolean;
}
