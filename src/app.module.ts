import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [AuthModule, PrismaModule, FilesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],

})
export class AppModule {}
