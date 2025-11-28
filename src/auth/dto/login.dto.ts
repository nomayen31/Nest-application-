// dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'ohin@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'P@ssw0rd!', description: 'Plain text password' })
    @IsString()
    password: string;
}