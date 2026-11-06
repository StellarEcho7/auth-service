import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { BootstrapAdminService } from './bootstrap-admin.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, BootstrapAdminService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
