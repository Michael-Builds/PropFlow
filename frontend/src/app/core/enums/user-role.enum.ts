export enum UserRole {
  PlatformAdmin = 'platform_admin',
  Owner = 'owner',
  Manager = 'manager',
  Finance = 'finance',
  Vendor = 'vendor',
  Tenant = 'tenant',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PlatformAdmin]: 'Platform',
  [UserRole.Owner]: 'Owner',
  [UserRole.Manager]: 'Manager',
  [UserRole.Finance]: 'Finance',
  [UserRole.Vendor]: 'Vendor',
  [UserRole.Tenant]: 'Tenant',
};

/** Staff a company owner can invite (not platform admin). */
export const COMPANY_USER_ROLES = [
  UserRole.Owner,
  UserRole.Manager,
  UserRole.Finance,
  UserRole.Vendor,
  UserRole.Tenant,
] as const;

export const UserRoles = {
  all: [
    UserRole.PlatformAdmin,
    UserRole.Owner,
    UserRole.Manager,
    UserRole.Finance,
    UserRole.Vendor,
    UserRole.Tenant,
  ] as const,
  company: COMPANY_USER_ROLES,
  portfolio: [UserRole.Owner, UserRole.Manager] as const,
  collections: [UserRole.Owner, UserRole.Manager, UserRole.Finance] as const,
  tickets: [UserRole.Owner, UserRole.Manager, UserRole.Vendor, UserRole.Tenant] as const,
  messaging: [UserRole.PlatformAdmin, UserRole.Owner, UserRole.Manager, UserRole.Tenant] as const,
  documents: [UserRole.Owner, UserRole.Manager, UserRole.Finance, UserRole.Tenant] as const,
  audit: [UserRole.Owner] as const,
  platform: [UserRole.PlatformAdmin] as const,
} as const;
