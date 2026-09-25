import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class UsersRepository {
  // In‑memory placeholder store – replace with a proper DB later
  private readonly users: UserDto[] = [];

  async findAll(): Promise<UserDto[]> {
    await Promise.resolve();
    return this.users;
  }

  async create(user: UserDto): Promise<UserDto> {
    await Promise.resolve();
    this.users.push(user);
    return user;
  }

  async delete(id: string): Promise<void> {
    await Promise.resolve();
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) this.users.splice(index, 1);
  }

  async updateRoles(id: string, roles: RoleDto[]): Promise<void> {
    await Promise.resolve();
    const user = this.users.find((u) => u.id === id);
    if (user) user.roles = roles;
  }
}
