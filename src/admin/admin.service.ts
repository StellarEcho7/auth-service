import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';
import { RoleName } from '../users/dto/role.dto';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  async getAllUsers(): Promise<UserDto[]> {
    return this.usersService.getAllUsers();
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.usersService.deleteUser(id);
  }

  async updateUserRoles(
    id: string,
    roles: RoleName[],
  ): Promise<{ message: string }> {
    return this.usersService.updateUserRoles(id, roles);
  }
}
