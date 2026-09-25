import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { UserDto } from '../users/dto/user.dto';
import { RoleDto } from '../users/dto/role.dto';

@Injectable()
export class AdminService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAllUsers(): Promise<UserDto[]> {
    return this.usersRepository.findAll();
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.usersRepository.delete(id);
    return { message: `User ${id} deleted (admin) (not implemented)` };
  }

  async updateUserRoles(
    id: string,
    roles: RoleDto[],
  ): Promise<{ message: string }> {
    await this.usersRepository.updateRoles(id, roles);
    return {
      message: `Roles for user ${id} updated (admin) (not implemented)`,
    };
  }
}
