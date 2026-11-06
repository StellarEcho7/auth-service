import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidRefreshTokenError } from '../auth/errors/invalid-refresh-token.error';

@Catch(InvalidRefreshTokenError)
export class InvalidRefreshTokenFilter implements ExceptionFilter {
  catch(exception: InvalidRefreshTokenError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: exception.message,
    });
  }
}
