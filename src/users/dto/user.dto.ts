import { RoleName } from './role.dto';

export class UserDto {
  id: string;
  email: string;
  passwordHash: string;
  roles: RoleName[];
}
