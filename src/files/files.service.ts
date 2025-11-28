// files.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  buildFileUrl(filename: string) {
    const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT || 5000}`;
    return `${base}/uploads/${filename}`;
  }

  async saveFileToDB(file: Express.Multer.File, userId?: number) {
    return this.prisma.file.create({
      data: {
        filename: file.filename,
        url: this.buildFileUrl(file.filename),
        mimetype: file.mimetype,
        size: file.size,
        userId: userId, // optional: link file to user
      },
    });
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
    return this.prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFileById(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async deleteFile(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id },
    });

    // Optional: Delete physical file from disk
    // const fs = require('fs');
    // const path = require('path');
    // const filePath = path.join(process.cwd(), 'uploads', file.filename);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }

    return { message: 'File deleted successfully', id };
  }
}