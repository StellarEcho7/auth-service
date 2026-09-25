import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { APP_FILTER } from '@nestjs/core';
import { DuplicateEmailFilter } from './filters/duplicate-email.filter';

@Module({
  imports: [AuthModule, UsersModule, AdminModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: DuplicateEmailFilter },
  ],
})
export class AppModule {}
