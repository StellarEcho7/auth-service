import { Request } from 'express';
import { UserDto } from '../../users/dto/user.dto';

export type AuthenticatedUser = Pick<UserDto, 'id' | 'email' | 'roles'>;

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
