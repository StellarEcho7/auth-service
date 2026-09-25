import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { RoleName } from './dto/role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getMe(): Promise<UserDto> {
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
    roles: RoleName[],
  ): Promise<{ message: string }> {
    await this.usersRepository.updateRoles(id, roles);
    return { message: `Roles for user ${id} updated (not implemented)` };
  }

  async create(dto: CreateUserDto): Promise<UserDto> {
    const hashed = await argon2.hash(dto.password);
    return this.usersRepository.create({
      email: dto.email,
      password: hashed,
      roles: [RoleName.USER],
    });
  }
}
