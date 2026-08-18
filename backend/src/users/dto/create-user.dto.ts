import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ enum: ['owner', 'manager', 'finance', 'vendor', 'tenant'] })
  @IsIn(['owner', 'manager', 'finance', 'vendor', 'tenant'])
  role: 'owner' | 'manager' | 'finance' | 'vendor' | 'tenant';

  @ApiPropertyOptional({ description: 'Temporary password. Generated if omitted.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorId?: string;
}
