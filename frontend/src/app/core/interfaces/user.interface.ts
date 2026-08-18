import { UserRole } from './nav.interface';

export interface SessionUser {
  id: string;
  orgId: string | null;
  fullName: string;
  email: string;
  role: UserRole;
  initials: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}
