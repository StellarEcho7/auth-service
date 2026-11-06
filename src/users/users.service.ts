import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserDto } from './dto/user.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { RoleName } from './dto/role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DuplicateEmailError } from './errors/duplicate-email.error';
import { LastAdminError } from './errors/last-admin.error';
import { UserNotFoundError } from './errors/user-not-found.error';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  private dummyHash: Promise<string> | null = null;

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

  async deleteUser(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      return;
    }
    await this.assertNotLastAdmin(user, false);
    await this.usersRepository.delete(id);
  }

  async updateUserRoles(
    id: string,
    roles: RoleName[],
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    await this.assertNotLastAdmin(user, roles.includes(RoleName.ADMIN));
    const updated = await this.usersRepository.updateRoles(id, roles);
    if (!updated) {
      throw new UserNotFoundError(id);
    }
    return toUserResponse(updated);
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

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<UserDto | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      // Verify against a dummy hash so unknown emails take the same time as
      // wrong passwords and cannot be distinguished by response timing.
      const dummyHash = await this.getDummyHash();
      await argon2.verify(dummyHash, password).catch(() => false);
      return null;
    }

    try {
      const valid = await argon2.verify(user.passwordHash, password);
      return valid ? user : null;
    } catch {
      return null;
    }
  }

  private async assertNotLastAdmin(
    user: UserDto,
    keepsAdmin: boolean,
  ): Promise<void> {
    if (!user.roles.includes(RoleName.ADMIN) || keepsAdmin) {
      return;
    }
    const admins = await this.usersRepository.countByRole(RoleName.ADMIN);
    if (admins <= 1) {
      throw new LastAdminError();
    }
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash(randomUUID());
    return this.dummyHash;
  }
}
