import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RoleName } from '../users/dto/role.dto';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  async getAllUsers(): Promise<UserResponseDto[]> {
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
