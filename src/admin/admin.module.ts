import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersRepository } from '../users/users.repository';

@Module({
  imports: [],
  controllers: [AdminController],
  providers: [AdminService, UsersRepository],
  exports: [AdminService],
})
export class AdminModule {}
