import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AdminController } from '../admin/admin.controller';

@Module({
  imports: [],
  controllers: [UsersController, AdminController],
  providers: [UsersService, UsersRepository],
  exports: [],
})
export class UsersModule {}
