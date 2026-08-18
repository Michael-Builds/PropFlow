import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLogger } from '../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const path = request.originalUrl ?? request.url;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.resolveMessage(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(message, stack, AllExceptionsFilter.name);
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      path,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return payload;
      }
      if (payload && typeof payload === 'object' && 'message' in payload) {
        const value = (payload as { message: string | string[] }).message;
        return Array.isArray(value) ? value.join(', ') : value;
      }
      return exception.message;
    }

    if (process.env.NODE_ENV === 'production') {
      return status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : 'Request failed';
    }

    return exception instanceof Error ? exception.message : 'Unexpected error';
  }
}
