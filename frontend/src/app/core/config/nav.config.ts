import { NavSection, UserRole } from '../interfaces/nav.interface';
import { ThemeOption } from '../interfaces/theme.interface';

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: 'Platform',
  owner: 'Owner',
  manager: 'Manager',
  finance: 'Finance',
  vendor: 'Vendor',
  tenant: 'Tenant',
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['owner', 'manager', 'finance', 'vendor', 'tenant', 'platform_admin'] },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    items: [
      { id: 'properties', label: 'Properties', path: '/properties', icon: 'building', roles: ['owner', 'manager'] },
      { id: 'units', label: 'Units', path: '/units', icon: 'door', roles: ['owner', 'manager'] },
      { id: 'tenants', label: 'Tenants', path: '/tenants', icon: 'users', roles: ['owner', 'manager'] },
      { id: 'leases', label: 'Leases', path: '/leases', icon: 'file', roles: ['owner', 'manager'] },
    ],
  },
  {
    id: 'finance',
    label: 'Collections',
    items: [
      { id: 'invoices', label: 'Invoices', path: '/invoices', icon: 'invoice', roles: ['owner', 'manager', 'finance'] },
      { id: 'payments', label: 'Payments', path: '/payments', icon: 'wallet', roles: ['owner', 'manager', 'finance'] },
      { id: 'arrears', label: 'Arrears', path: '/arrears', icon: 'alert', roles: ['owner', 'manager', 'finance'] },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { id: 'tickets', label: 'Maintenance', path: '/tickets', icon: 'wrench', roles: ['owner', 'manager', 'vendor', 'tenant'] },
      { id: 'documents', label: 'Documents', path: '/documents', icon: 'folder', roles: ['owner', 'manager', 'finance', 'tenant'] },
      { id: 'notifications', label: 'Notifications', path: '/notifications', icon: 'bell', roles: ['owner', 'manager', 'finance', 'vendor', 'tenant', 'platform_admin'], badgeKey: 'notifications' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { id: 'organizations', label: 'Companies', path: '/organizations', icon: 'globe', roles: ['platform_admin'] },
      { id: 'users', label: 'Users', path: '/users', icon: 'users', roles: ['owner', 'manager'] },
      { id: 'audit', label: 'Audit logs', path: '/audit-logs', icon: 'shield', roles: ['owner'] },
      { id: 'appearance', label: 'Appearance', path: '/appearance', icon: 'palette', roles: ['owner', 'manager', 'finance', 'vendor', 'tenant', 'platform_admin'] },
    ],
  },
];

export const THEMES: ThemeOption[] = [
  { id: 'atlantic', name: 'Atlantic', description: 'Electric blue over navy — operations default.', swatch: '#0028f2', accent: '#3d5cff', navy: '#0f1035' },
  { id: 'forest', name: 'Forest', description: 'Deep greens for property portfolios.', swatch: '#0f7a4a', accent: '#2db87a', navy: '#0b211a' },
  { id: 'ember', name: 'Ember', description: 'Warm terracotta for collections desks.', swatch: '#c2410c', accent: '#ea580c', navy: '#1c0f0b' },
  { id: 'graphite', name: 'Graphite', description: 'Cool slate for finance work.', swatch: '#334155', accent: '#64748b', navy: '#0f172a' },
  { id: 'orchid', name: 'Orchid', description: 'Quiet violet for a calmer workspace.', swatch: '#6d28d9', accent: '#8b5cf6', navy: '#1e0b3d' },
];
