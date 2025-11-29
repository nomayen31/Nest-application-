
// ==================== FILE 4: src/mail/dto/send-email.dto.ts ====================
import { IsEmail, IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Important Notification' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'This is the email body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: '<h1>Hello</h1><p>HTML content</p>', required: false })
  @IsString()
  @IsOptional()
  htmlBody?: string;
}

export class SendBulkEmailDto {
  @ApiProperty({ 
    example: ['user1@example.com', 'user2@example.com'],
    type: [String]
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  emails: string[];

  @ApiProperty({ example: 'Important Announcement' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'This is the email body text' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: '<h1>Announcement</h1>', required: false })
  @IsString()
  @IsOptional()
  htmlBody?: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'New Feature Available' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We have launched a new feature...' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
