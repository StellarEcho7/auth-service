import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { RoleName } from './dto/role.dto';
import { randomUUID } from 'node:crypto';
import { DuplicateEmailError } from './errors/duplicate-email.error';

@Injectable()
export class UsersRepository {
  // In‑memory placeholder store
  private readonly users: UserDto[] = [];

  async findAll(): Promise<UserDto[]> {
    await Promise.resolve();
    return this.users;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    await Promise.resolve();
    const user = this.users.find((u) => u.email === email);
    return user ?? null;
  }

  async create(data: Omit<UserDto, 'id'>): Promise<UserDto> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new DuplicateEmailError(data.email);
    }
    const newUser: UserDto = {
      id: randomUUID(),
      ...data,
    };
    this.users.push(newUser);
    return newUser;
  }

  async delete(id: string): Promise<void> {
    await Promise.resolve();
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) this.users.splice(index, 1);
  }

  async updateRoles(id: string, roles: RoleName[]): Promise<void> {
    await Promise.resolve();
    const user = this.users.find((u) => u.id === id);
    if (user) user.roles = roles;
  }
}
