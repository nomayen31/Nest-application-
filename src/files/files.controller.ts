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
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '/uploads/avatar.png', nullable: true })
  avatar?: string;
}

class FileDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'avatar.png' })
  filename: string;

  @ApiProperty({ example: '/uploads/avatar.png' })
  url: string;

  @ApiProperty({ example: 'image/png', required: false })
  mimetype?: string;

  @ApiProperty({ example: 34567, required: false })
  size?: number;

  @ApiProperty({ example: 5, nullable: true })
  userId?: number | null;

  @ApiProperty({ example: 'John Doe', nullable: true })
  userName?: string | null;

  @ApiProperty({ example: '2025-11-29T09:12:34.000Z' })
  createdAt: string;

  @ApiProperty({ type: () => UserDto, required: false })
  user?: UserDto;
}

class FileListDto {
  @ApiProperty({ type: [FileDto] })
  data: FileDto[];
}

class StandardResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;

  @ApiProperty({ nullable: true })
  data?: T;
}

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // ==================== PUBLIC FILE UPLOAD (now protected + saves owner) ====================
  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload a file and save metadata in DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: anyFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  @ApiCreatedResponse({
    description: 'File uploaded and metadata saved.',
    type: FileDto,
  })
  @ApiBadRequestResponse({ description: 'No file uploaded / invalid input' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email || null;

    const saved = await this.filesService.saveFileToDB(file, userId, userName);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: saved,
    } as StandardResponse<FileDto>;
  }

  // ==================== UPLOAD AVATAR (PROTECTED) ====================
  @Post('upload-avatar/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload avatar for a user' })
  @ApiParam({ name: 'id', required: true, description: 'User ID', type: Number })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  @ApiCreatedResponse({
    description: 'Avatar uploaded and user updated.',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/FileDto' },
        {
          properties: {
            user: { $ref: '#/components/schemas/UserDto' },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'No file uploaded / invalid input' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Save the file; here we pass userId as a string in your existing code, but ideally pass number
    // (adjusted to keep your earlier change where saveFileToDB accepted string for avatar owner)
    const saved = await this.filesService.saveFileToDB(file, id.toString());
    const user = await this.filesService.attachAvatarToUser(id, saved.url);

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      file: saved,
      user,
    } as any;
  }

  // ==================== UPLOAD MULTIPLE FILES (protected + saves owner) ====================
  @Post('upload-multiple')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage,
      fileFilter: anyFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // per file
    }),
  )
  @ApiCreatedResponse({
    description: 'Multiple files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: { $ref: '#/components/schemas/FileDto' } },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'No files uploaded / invalid input' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async uploadMultiple(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email || null;

    const items = await Promise.all(
      files.map((f) => this.filesService.saveFileToDB(f, userId, userName)),
    );

    return {
      success: true,
      message: `${items.length} files uploaded successfully`,
      data: items,
    } as StandardResponse<FileDto[]>;
  }

  // ==================== GET USER FILES (PROTECTED - by id) ====================
  @Get('user/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all files for a user' })
  @ApiParam({ name: 'id', required: true, description: 'User ID', type: Number })
  @ApiOkResponse({
    description: 'Files fetched successfully',
    type: FileDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async getUserFiles(@Param('id', ParseIntPipe) id: number) {
    const files = await this.filesService.getUserFiles(id);

    return {
      success: true,
      message: 'Files fetched successfully',
      data: files,
    } as StandardResponse<FileDto[]>;
  }

  // ==================== GET FILES FOR CURRENT AUTHENTICATED USER ====================
  @Get('my-files')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all files for current authenticated user' })
  @ApiOkResponse({
    description: 'Your files fetched successfully',
    type: FileDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  async getMyFiles(@Req() req: any) {
    const userId = req.user?.id;
    const files = await this.filesService.getUserFiles(userId);

    return {
      success: true,
      message: 'Your files fetched successfully',
      data: files,
    } as StandardResponse<FileDto[]>;
  }

  // ==================== GET FILE BY ID ====================
  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', required: true, description: 'File ID', type: Number })
  @ApiOkResponse({ description: 'File fetched successfully', type: FileDto })
  @ApiNotFoundResponse({ description: 'File not found' })
  async getFileById(@Param('id', ParseIntPipe) id: number) {
    const file = await this.filesService.getFileById(id);

    return {
      success: true,
      message: 'File fetched successfully',
      data: file,
    } as StandardResponse<FileDto>;
  }

  // ==================== DELETE FILE (PROTECTED; restricted by owner) ====================
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', required: true, description: 'File ID', type: Number })
  @ApiOkResponse({
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: { message: { type: 'string' }, id: { type: 'number' } },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
  @ApiForbiddenResponse({ description: 'You can only delete your own files' })
  @ApiNotFoundResponse({ description: 'File not found' })
  async deleteFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const result = await this.filesService.deleteFile(id, userId);

    return {
      success: true,
      message: 'File deleted successfully',
      data: result,
    } as StandardResponse<{ message: string; id: number }>;
  }
}
