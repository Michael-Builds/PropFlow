import {
  PLATFORM_AVAILABILITY_MODES,
  PlatformAvailabilityMode,
} from '../enums/domain.enum';

export { PlatformAvailabilityMode, PLATFORM_AVAILABILITY_MODES };

export interface PlatformAvailabilityState {
  mode: PlatformAvailabilityMode;
  title: string;
  message: string;
  supportEmail: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  notificationsQueued?: number;
}

export const PLATFORM_AVAILABILITY_DEFAULTS: Record<
  Exclude<PlatformAvailabilityMode, PlatformAvailabilityMode.Live>,
  { title: string; message: string }
> = {
  [PlatformAvailabilityMode.Maintenance]: {
    title: 'PropFlow is under maintenance',
    message:
      'We are making improvements to keep property operations running smoothly. Please try again shortly.',
  },
  [PlatformAvailabilityMode.ComingSoon]: {
    title: 'PropFlow is coming soon',
    message: 'We are putting the finishing touches on PropFlow. Check back shortly.',
  },
};
