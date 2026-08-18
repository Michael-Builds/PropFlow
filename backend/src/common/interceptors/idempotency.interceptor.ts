import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../redis/redis.service';

const TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest();
    if (!['POST', 'PATCH', 'PUT'].includes(String(req.method))) {
      return next.handle();
    }
    const header = req.headers['idempotency-key'];
    const key = Array.isArray(header) ? header[0] : header;
    if (!key) return next.handle();

    const userId = req.user?.sub ?? 'anon';
    const cacheKey = `idem:${userId}:${req.method}:${req.originalUrl ?? req.url}:${key}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap((value) => {
        void this.redis.client.set(cacheKey, JSON.stringify(value ?? null), 'EX', TTL_SECONDS);
      }),
    );
  }
}
