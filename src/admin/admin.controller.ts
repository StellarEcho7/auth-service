import { Controller, Get, Delete, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RoleDto } from '../users/dto/role.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Patch('users/:id/roles')
  updateUserRoles(@Param('id') id: string, @Body() body: { roles: RoleDto[] }) {
    // Expect body.roles = RoleDto[]
    return this.usersService.updateUserRoles(id, body.roles);
  }
}
