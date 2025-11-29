// ==================== FILE 2: src/mail/mail.service.ts ====================
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  async sendToUser(
    email: string,
    subject: string,
    body: string,
    htmlBody?: string,
    adminUserId?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        text: body,
        html: htmlBody || body,
      });

      const emailRecord = await this.prisma.email.create({
        data: {
          to: email,
          subject: subject,
          body: body,
          htmlBody: htmlBody,
          status: 'sent',
          userId: adminUserId,
          recipientId: user.id,
        },
      });

      return {
        success: true,
        message: 'Email sent successfully',
        data: emailRecord,
      };
    } catch (error) {
      await this.prisma.email.create({
        data: {
          to: email,
          subject: subject,
          body: body,
          htmlBody: htmlBody,
          status: 'failed',
          error: error.message,
          userId: adminUserId,
          recipientId: user.id,
        },
      });

      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  async sendToMultipleUsers(
    emails: string[],
    subject: string,
    body: string,
    htmlBody?: string,
    adminUserId?: number,
  ) {
    const results: {
      successful: Array<{ email: string; success: boolean; message: string; data: any }>;
      failed: Array<{ email: string; error: string }>;
    } = {
      successful: [],
      failed: [],
    };

    for (const email of emails) {
      try {
        const result = await this.sendToUser(email, subject, body, htmlBody, adminUserId);
        results.successful.push({ email, ...result });
      } catch (error) {
        results.failed.push({ email, error: error.message });
      }
    }

    return {
      success: true,
      message: `Sent ${results.successful.length} emails, ${results.failed.length} failed`,
      data: results,
    };
  }

  async sendNotification(
    email: string,
    title: string,
    message: string,
    adminUserId?: number,
  ) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendToUser(email, title, message, htmlBody, adminUserId);
  }

  async getUserEmailHistory(userId: number) {
    const emails = await this.prisma.email.findMany({
      where: { recipientId: userId },
      orderBy: { sentAt: 'desc' },
    });

    return {
      success: true,
      data: emails,
    };
  }

  async getAllEmails(limit: number = 50) {
    const emails = await this.prisma.email.findMany({
      take: limit,
      orderBy: { sentAt: 'desc' },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: emails,
    };
  }
}
