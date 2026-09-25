import { Controller, Get, Delete, Patch, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RoleDto } from '../users/dto/role.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/roles')
  updateUserRoles(@Param('id') id: string, @Body() body: { roles: RoleDto[] }) {
    // Expect body.roles = RoleDto[]
    return this.adminService.updateUserRoles(id, body.roles);
  }
}
