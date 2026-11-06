import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { RoleName } from '../users/dto/role.dto';
import { CannotDeleteSelfError } from './errors/cannot-delete-self.error';

@Injectable()
export class AdminService {
  constructor(private readonly usersService: UsersService) {}

  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }

  async deleteUser(actorId: string, targetId: string): Promise<void> {
    if (actorId === targetId) {
      throw new CannotDeleteSelfError();
    }
    await this.usersService.deleteUser(targetId);
  }

  async updateUserRoles(
    id: string,
    roles: RoleName[],
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRoles(id, roles);
  }
}
