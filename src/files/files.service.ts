// files.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) { }

  buildFileUrl(filename: string) {
    const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT || 5000}`;
    return `${base}/uploads/${filename}`;
  }

  // Helper method to transform Prisma file to DTO format
  private transformFileToDto(file: any) {
    return {
      ...file,
      createdAt: file.createdAt.toISOString(), // Convert Date to string
    };
  }

  async saveFileToDB(file: Express.Multer.File, name: string, userId?: number, userName?: string) {
    const created = await this.prisma.file.create({
      data: {
        filename: file.filename,
        url: this.buildFileUrl(file.filename),
        mimetype: file.mimetype,
        size: file.size,
        userId: userId,
        name: name,
        userName: userName
      },
    });
    return this.transformFileToDto(created);
  }

  async attachAvatarToUser(userId: number, fileUrl: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: fileUrl },
    });
  }

  async getUserFiles(userId: number) {
    const files = await this.prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return files.map(file => this.transformFileToDto(file));
  }

  async getFileById(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return this.transformFileToDto(file);
  }

  async deleteFile(id: number, userId?: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    // Check ownership
    if (userId && file.userId !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    await this.prisma.file.delete({
      where: { id },
    });

    return { message: 'File deleted successfully', id };
  }
}