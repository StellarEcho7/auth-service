import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getMe(): Promise<UserDto> {
    // Placeholder: In a real app you would get the user from the request/context
    return Promise.resolve({
      id: 'dummy-id',
      email: 'dummy@example.com',
      password: '',
      roles: [],
    } as UserDto);
  }

  getAllUsers(): Promise<UserDto[]> {
    return this.usersRepository.findAll();
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    await this.usersRepository.delete(id);
    return { message: `User ${id} deleted (not implemented)` };
  }

  async updateUserRoles(
    id: string,
    roles: RoleDto[],
  ): Promise<{ message: string }> {
    await this.usersRepository.updateRoles(id, roles);
    return { message: `Roles for user ${id} updated (not implemented)` };
  }
}
