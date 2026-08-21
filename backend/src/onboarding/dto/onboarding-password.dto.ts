import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class OnboardingPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}
