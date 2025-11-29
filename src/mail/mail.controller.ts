// ==================== FILE 3: src/mail/mail.controller.ts ====================
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiResponse 
} from '@nestjs/swagger';
import { SendEmailDto, SendBulkEmailDto, SendNotificationDto } from './dto/send-email.dto';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send email to a user by email address' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendEmail(@Body() dto: SendEmailDto, @Req() req: any) {
    const adminUserId = req.user.id;
    
    return this.mailService.sendToUser(
      dto.email,
      dto.subject,
      dto.body,
      dto.htmlBody,
      adminUserId,
    );
  }

  @Post('send-bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send email to multiple users' })
  @ApiResponse({ status: 200, description: 'Bulk emails sent' })
  async sendBulkEmail(@Body() dto: SendBulkEmailDto, @Req() req: any) {
    const adminUserId = req.user.id;
    
    return this.mailService.sendToMultipleUsers(
      dto.emails,
      dto.subject,
      dto.body,
      dto.htmlBody,
      adminUserId,
    );
  }

  @Post('send-notification')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send notification email to a user' })
  async sendNotification(@Body() dto: SendNotificationDto, @Req() req: any) {
    const adminUserId = req.user.id;
    
    return this.mailService.sendNotification(
      dto.email,
      dto.title,
      dto.message,
      adminUserId,
    );
  }

  @Get('history/user/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get email history for a specific user' })
  async getUserEmailHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.mailService.getUserEmailHistory(userId);
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all sent emails (admin)' })
  async getAllEmails(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 50;
    return this.mailService.getAllEmails(limitNumber);
  }

  @Get('my-history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get email history for current user' })
  async getMyEmailHistory(@Req() req: any) {
    const userId = req.user.id;
    return this.mailService.getUserEmailHistory(userId);
  }
}
