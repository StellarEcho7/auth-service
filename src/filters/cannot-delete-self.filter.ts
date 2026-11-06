import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CannotDeleteSelfError } from '../admin/errors/cannot-delete-self.error';

@Catch(CannotDeleteSelfError)
export class CannotDeleteSelfFilter implements ExceptionFilter {
  catch(exception: CannotDeleteSelfError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      message: exception.message,
    });
  }
}
