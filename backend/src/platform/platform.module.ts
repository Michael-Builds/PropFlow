import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformAvailabilityController } from './platform-availability.controller';
import { PlatformAvailabilityService } from './platform-availability.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [PrismaModule, UsersModule, NotificationsModule, RealtimeModule, ComplianceModule],
  controllers: [PlatformController, PlatformAvailabilityController],
  providers: [PlatformService, PlatformAvailabilityService],
  exports: [PlatformAvailabilityService],
})
export class PlatformModule {}
