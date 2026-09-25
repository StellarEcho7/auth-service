import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get('me')
  getMe() {
    // TODO: return current user profile
    return { message: 'Current user endpoint (not implemented)' };
  }
}
