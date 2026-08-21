import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { AppLogger } from '../logger/app-logger.service';
import { redactPii } from '../pii';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly logger: AppLogger,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        void this.auditLogsService
          .create({
            orgId: req.user?.orgId ?? 'org_demo',
            actorUserId: req.user?.sub,
            action: `${method} ${req.originalUrl}`,
            entityType: 'api_action',
            entityId: responseBody?.id,
            afterJson: redactPii(responseBody ?? {}),
            ip: req.ip,
          })
          .catch((error: unknown) => {
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
              `Failed to write audit log for ${method} ${req.originalUrl}`,
              stack,
              AuditLogInterceptor.name,
            );
          });
      }),
    );
  }
}
