import { Controller, Get, Delete, Patch, Param, Body } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('users')
  getAllUsers() {
    // TODO: list all users for admin
    return { message: 'Admin users list (not implemented)' };
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    // TODO: delete user by id
    return { message: `Delete user ${id} (not implemented)` };
  }

  @Patch('users/:id/roles')
  updateUserRoles(@Param('id') id: string, @Body() body: any) {
    // TODO: update user roles
    return { message: `Update roles for user ${id} (not implemented)` };
  }
}
