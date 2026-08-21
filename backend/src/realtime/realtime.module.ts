import { Module } from '@nestjs/common';
import { PlatformRealtimeGateway } from './platform-realtime.gateway';

@Module({
  providers: [PlatformRealtimeGateway],
  exports: [PlatformRealtimeGateway],
})
export class RealtimeModule {}
