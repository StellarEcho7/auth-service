import { Expose, plainToInstance } from 'class-transformer';
import { RoleName } from './role.dto';
import { UserDto } from './user.dto';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  roles: RoleName[];
}

export function toUserResponse(
  user: Pick<UserDto, 'id' | 'email' | 'roles'>,
): UserResponseDto {
  return plainToInstance(UserResponseDto, user, {
    excludeExtraneousValues: true,
  });
}
