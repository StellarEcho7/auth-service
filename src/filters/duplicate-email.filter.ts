import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DuplicateEmailError } from '../users/errors/duplicate-email.error';

@Catch(DuplicateEmailError)
export class DuplicateEmailFilter implements ExceptionFilter {
  catch(exception: DuplicateEmailError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message: exception.message,
    });
  }
}
