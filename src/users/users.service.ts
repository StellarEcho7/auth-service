import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { RoleName } from './dto/role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DuplicateEmailError } from './errors/duplicate-email.error';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getMe(): Promise<UserResponseDto> {
    // Placeholder: In a real app you would get the user from the request/context
    return Promise.resolve({
      id: 'dummy-id',
      email: 'dummy@example.com',
      roles: [],
    });
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => toUserResponse(user));
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
    // Fast-fail before the expensive hash; the repository remains the authority
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new DuplicateEmailError(dto.email);
    }
    const hashed = await argon2.hash(dto.password);
    return this.usersRepository.create({
      email: dto.email,
      passwordHash: hashed,
      roles: [RoleName.USER],
    });
  }
}
