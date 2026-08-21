import { UserRole } from '../enums/user-role.enum';

export interface SessionUser {
  id: string;
  orgId: string | null;
  fullName: string;
  email: string;
  role: UserRole;
  initials: string;
  mustChangePassword: boolean;
  onboardingComplete: boolean;
  orgName: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}
