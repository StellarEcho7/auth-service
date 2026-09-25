import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() body: any) {
    // TODO: implement registration logic
    return { message: 'Register endpoint (not implemented)' };
  }

  @Post('login')
  login(@Body() body: any) {
    return { message: 'Login endpoint (not implemented)' };
  }

  @Post('refresh')
  refresh(@Body() body: any) {
    return { message: 'Refresh endpoint (not implemented)' };
  }

  @Post('logout')
  logout(@Body() body: any) {
    return { message: 'Logout endpoint (not implemented)' };
  }
}
