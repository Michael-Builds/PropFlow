import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const startedAt = Date.now();
    const method = req.method as string;
    const path = String(req.originalUrl ?? req.url ?? '');

    return next.handle().pipe(
      tap(() => this.write(method, path, res.statusCode, startedAt)),
      catchError((error: unknown) => {
        const status =
          error instanceof HttpException ? error.getStatus() : res.statusCode || 500;
        this.write(method, path, status, startedAt);
        return throwError(() => error);
      }),
    );
  }

  private write(
    method: string,
    path: string,
    status: number,
    startedAt: number,
  ): void {
    const message = `${method} ${path} ${status} ${Date.now() - startedAt}ms`;

    if (status >= 500) {
      this.logger.error(message, HttpLoggingInterceptor.name);
      return;
    }
    if (status >= 400) {
      this.logger.warning(message, HttpLoggingInterceptor.name);
      return;
    }
    if (path.includes('/health')) {
      this.logger.debug(message, HttpLoggingInterceptor.name);
      return;
    }
    this.logger.success(message, HttpLoggingInterceptor.name);
  }
}
