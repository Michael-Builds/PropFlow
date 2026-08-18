import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type {
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { AppLogger } from '../logger/app-logger.service';
import { getClientIp } from './client-ip';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly logger: AppLogger,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path = String(req.originalUrl ?? req.url ?? '');
    return (
      path.includes('/health') ||
      path.includes('/payments/webhook') ||
      path.startsWith('/docs') ||
      path.startsWith('/swagger')
    );
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.sub ?? 'anon';
    return `${userId}:${getClientIp(req)}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest();
    this.logger.warning(
      `Rate limit exceeded for ${req.method} ${req.originalUrl ?? req.url} tracker=${throttlerLimitDetail.tracker}`,
      AppThrottlerGuard.name,
    );
    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
