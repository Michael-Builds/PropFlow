import { DataCollection } from '../enums/data-collection.enum';
import { UserRole, UserRoles } from '../enums/user-role.enum';

/** Backend GET-list roles. Keep in sync with Nest @Roles on list endpoints. */
export const COLLECTION_READ_ROLES: Record<DataCollection, readonly UserRole[]> = {
  [DataCollection.Properties]: UserRoles.portfolio,
  [DataCollection.Units]: UserRoles.portfolio,
  [DataCollection.Tenants]: UserRoles.portfolio,
  [DataCollection.Leases]: [...UserRoles.portfolio, UserRole.Finance, UserRole.Tenant],
  [DataCollection.Invoices]: [...UserRoles.collections, UserRole.Tenant],
  [DataCollection.Payments]: UserRoles.collections,
  [DataCollection.Arrears]: UserRoles.collections,
  [DataCollection.Tickets]: UserRoles.tickets,
  [DataCollection.Documents]: UserRoles.documents,
  [DataCollection.Notifications]: UserRoles.all,
  [DataCollection.AuditLogs]: UserRoles.audit,
  [DataCollection.Users]: UserRoles.portfolio,
  [DataCollection.Organizations]: UserRoles.platform,
};

export function canReadCollection(role: UserRole | null | undefined, name: DataCollection): boolean {
  if (!role) return false;
  return COLLECTION_READ_ROLES[name].includes(role);
}
