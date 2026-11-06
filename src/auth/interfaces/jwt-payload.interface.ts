import { RoleName } from '../../users/dto/role.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: RoleName[];
  type: 'access';
}
