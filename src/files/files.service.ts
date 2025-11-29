// files.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  // Build public file URL
  buildFileUrl(filename: string) {
    const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT || 5000}`;
    return `${base}/uploads/${filename}`;
  }

  // Transform Prisma file to DTO format
  private transformFileToDto(file: any) {
    return {
      ...file,
      createdAt: file.createdAt ? file.createdAt.toISOString() : null,
    };
  }

  /**
   * Save file metadata to database.
   *
   * @param file Multer file object
   * @param userId optional numeric owner id
   * @param userName optional owner name/email
   */
  async saveFileToDB(
    file: Express.Multer.File,
    userId?: number | null,
    userName?: string | null,
  ) {
    const created = await this.prisma.file.create({
      data: {
        filename: file.filename,
        url: this.buildFileUrl(file.filename),
        mimetype: file.mimetype ?? null,
        size: typeof file.size === 'number' ? file.size : null,
        userId: typeof userId === 'number' ? userId : null, // must be number or null
        userName: userName ?? null, // optional column
      },
    });

    return this.transformFileToDto(created);
  }

  /**
   * Assign uploaded avatar URL to user profile
   */
  async attachAvatarToUser(userId: number, fileUrl: string) {
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

  /**
   * Get all files belonging to a specific user
   */
  async getUserFiles(userId: number) {
    const files = await this.prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return files.map((file) => this.transformFileToDto(file));
  }

  /**
   * Get file details by file ID
   */
  async getFileById(id: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return this.transformFileToDto(file);
  }

  /**
   * Delete file if the authenticated user owns it
   */
  async deleteFile(id: number, userId?: number) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    // Restrict deletion to owner
    if (typeof userId === 'number' && file.userId !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    await this.prisma.file.delete({
      where: { id },
    });

    return { message: 'File deleted successfully', id };
  }
}
