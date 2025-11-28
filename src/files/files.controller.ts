// files.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Param,
  ParseIntPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { storage } from './disk-storage';
import { imageFileFilter, anyFileFilter } from './file-upload.utils';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth, 
  ApiResponse 
} from '@nestjs/swagger';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // ==================== PUBLIC FILE UPLOAD ====================
  @Post('upload')
  @ApiOperation({ summary: 'Upload a file and save metadata in DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { 
      type: 'object', 
      properties: { 
        file: { type: 'string', format: 'binary' } 
      } 
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    storage,
    fileFilter: anyFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  }))
  @ApiResponse({ status: 201, description: 'File uploaded and metadata saved.' })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const saved = await this.filesService.saveFileToDB(file);
    
    return { 
      success: true, 
      message: 'File uploaded successfully',
      data: saved 
    };
  }

  // ==================== UPLOAD AVATAR (PROTECTED) ====================
  @Post('upload-avatar/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload avatar for a user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { 
      type: 'object', 
      properties: { 
        file: { type: 'string', format: 'binary' } 
      } 
    }
  })
  @UseInterceptors(FileInterceptor('file', {
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  }))
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const saved = await this.filesService.saveFileToDB(file, id);
    const user = await this.filesService.attachAvatarToUser(id, saved.url);
    
    return { 
      success: true, 
      message: 'Avatar uploaded successfully',
      file: saved, 
      user 
    };
  }

  // ==================== UPLOAD MULTIPLE FILES ====================
  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('files', 5, { 
    storage, 
    fileFilter: anyFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
  }))
  async uploadMultiple(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    const items = await Promise.all(
      files.map(f => this.filesService.saveFileToDB(f))
    );
    
    return { 
      success: true, 
      message: `${items.length} files uploaded successfully`,
      data: items 
    };
  }

  // ==================== GET USER FILES (PROTECTED) ====================
  @Get('user/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all files for a user' })
  async getUserFiles(@Param('id', ParseIntPipe) id: number) {
    const files = await this.filesService.getUserFiles(id);
    
    return {
      success: true,
      message: 'Files fetched successfully',
      data: files,
    };
  }

  // ==================== GET FILE BY ID ====================
  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  async getFileById(@Param('id', ParseIntPipe) id: number) {
    const file = await this.filesService.getFileById(id);
    
    return {
      success: true,
      message: 'File fetched successfully',
      data: file,
    };
  }

  // ==================== DELETE FILE (PROTECTED) ====================
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('id', ParseIntPipe) id: number) {
    const result = await this.filesService.deleteFile(id);
    
    return {
      success: true,
      message: 'File deleted successfully',
      data: result,
    };
  }
}