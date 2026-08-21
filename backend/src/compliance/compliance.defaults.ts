import type { EntityType } from '../generated/prisma/client';

/** Default Ghana property-ops pack (docs operators must keep in date). */
export const DEFAULT_COMPLIANCE_PACK: Array<{
  entityType: EntityType;
  docType: string;
  required: boolean;
  validityDays: number | null;
}> = [
  { entityType: 'tenant', docType: 'national_id', required: true, validityDays: null },
  { entityType: 'lease', docType: 'lease_agreement', required: true, validityDays: null },
  { entityType: 'property', docType: 'fire_certificate', required: true, validityDays: 365 },
  { entityType: 'property', docType: 'insurance', required: true, validityDays: 365 },
];
