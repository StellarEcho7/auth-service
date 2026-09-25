import { RoleName } from './role.dto';

export class UserDto {
  id: string;
  email: string;
  password: string;
  roles: RoleName[];
}
