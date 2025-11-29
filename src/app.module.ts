import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from './files/files.module';
import { MailModule } from './mail/mail.module';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, PrismaModule, FilesModule, MailModule, UsersModule],
  controllers: [AppController, UsersController],
  providers: [AppService, PrismaService, UsersService],

})
export class AppModule {}
