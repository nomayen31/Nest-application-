import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'newmail@example.com',
    description: 'Updated email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewPass123!',
    description: 'Updated password (min 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'New Ohin',
    description: 'Updated full name',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
