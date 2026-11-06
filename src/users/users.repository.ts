import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { RoleName } from './dto/role.dto';
import { randomUUID } from 'node:crypto';
import { DuplicateEmailError } from './errors/duplicate-email.error';

@Injectable()
export class UsersRepository {
  // In‑memory placeholder store – replace with a proper DB later
  private readonly users: UserDto[] = [];

  async findAll(): Promise<UserDto[]> {
    await Promise.resolve();
    return [...this.users];
  }

  async findById(id: string): Promise<UserDto | null> {
    await Promise.resolve();
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    await Promise.resolve();
    const normalized = this.normalizeEmail(email);
    return this.users.find((u) => u.email === normalized) ?? null;
  }

  async create(data: Omit<UserDto, 'id'>): Promise<UserDto> {
    // Yield first, then check + insert in one synchronous block to avoid TOCTOU races
    await Promise.resolve();
    const email = this.normalizeEmail(data.email);
    if (this.users.some((u) => u.email === email)) {
      throw new DuplicateEmailError(email);
    }
    const newUser: UserDto = {
      id: randomUUID(),
      ...data,
      email,
    };
    this.users.push(newUser);
    return newUser;
  }

  async delete(id: string): Promise<UserDto | null> {
    await Promise.resolve();
    const index = this.users.findIndex((u) => u.id === id);
    if (index < 0) return null;
    const [removed] = this.users.splice(index, 1);
    return removed;
  }

  async updateRoles(id: string, roles: RoleName[]): Promise<UserDto | null> {
    await Promise.resolve();
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.roles = roles;
    return user;
  }

  async countByRole(role: RoleName): Promise<number> {
    await Promise.resolve();
    return this.users.filter((u) => u.roles.includes(role)).length;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
