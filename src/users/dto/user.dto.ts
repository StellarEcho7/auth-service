import { RoleDto } from './role.dto';

export class UserDto {
  id: string;
  email: string;
  password: string;
  roles: RoleDto[];
}
