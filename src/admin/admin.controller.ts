import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RoleName } from '../users/dto/role.dto';
import { AdminService } from './admin.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';

@Controller('admin')
@Roles(RoleName.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.adminService.deleteUser(actor.id, id);
  }

  @Patch('users/:id/roles')
  updateUserRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserRolesDto,
  ) {
    return this.adminService.updateUserRoles(id, body.roles);
  }
}
