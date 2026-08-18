export type NavIconName =
  | 'dashboard'
  | 'building'
  | 'door'
  | 'users'
  | 'file'
  | 'invoice'
  | 'wallet'
  | 'alert'
  | 'wrench'
  | 'folder'
  | 'bell'
  | 'shield'
  | 'palette'
  | 'notifications'
  | 'settings'
  | 'chevron'
  | 'search'
  | 'menu'
  | 'close'
  | 'logout'
  | 'check'
  | 'warning'
  | 'info'
  | 'error'
  | 'plus'
  | 'filter'
  | 'refresh'
  | 'eye'
  | 'eyeOff'
  | 'mail'
  | 'lock'
  | 'phone'
  | 'copy'
  | 'trash'
  | 'edit'
  | 'external'
  | 'download'
  | 'globe'
  | 'activity'
  | 'clock';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: NavIconName;
  roles: UserRole[];
  badgeKey?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export type UserRole = 'platform_admin' | 'owner' | 'manager' | 'finance' | 'vendor' | 'tenant';
