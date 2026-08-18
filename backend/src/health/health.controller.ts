import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { THROTTLE_SKIP_ALL } from '../common/throttler/throttle.constants';

@ApiTags('health')
@SkipThrottle(THROTTLE_SKIP_ALL)
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'propflow-api' };
  }
}
