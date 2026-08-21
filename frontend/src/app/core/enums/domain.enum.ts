export enum OrgStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export enum UserStatus {
  Active = 'active',
  Disabled = 'disabled',
}

export enum RecordStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum UnitStatus {
  Occupied = 'occupied',
  Vacant = 'vacant',
  Maintenance = 'maintenance',
}

export enum UnitType {
  Studio = 'studio',
  OneBed = '1 bed',
  TwoBed = '2 bed',
  ThreeBed = '3 bed',
}

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  [UnitType.Studio]: 'Studio',
  [UnitType.OneBed]: '1 bed',
  [UnitType.TwoBed]: '2 bed',
  [UnitType.ThreeBed]: '3 bed',
};

export enum TenantStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export enum KycStatus {
  Pending = 'pending',
  Verified = 'verified',
}

export enum LeaseStatus {
  Active = 'active',
  Ending = 'ending',
  Terminated = 'terminated',
}

export enum BillingCycle {
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

export enum InvoiceStatus {
  Due = 'due',
  Paid = 'paid',
  Partial = 'partial',
  Overdue = 'overdue',
}

export enum PaymentStatus {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
  Abandoned = 'abandoned',
}

export enum PaymentMethod {
  BankTransfer = 'bank_transfer',
  MobileMoney = 'mobile_money',
  Cash = 'cash',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.BankTransfer]: 'Bank transfer',
  [PaymentMethod.MobileMoney]: 'Mobile money',
  [PaymentMethod.Cash]: 'Cash',
};

export enum PaymentDirection {
  In = 'in',
  Out = 'out',
}

export enum TicketStatus {
  Open = 'open',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.Assigned]: 'Assigned',
  [TicketStatus.InProgress]: 'In progress',
  [TicketStatus.Resolved]: 'Resolved',
  [TicketStatus.Closed]: 'Closed',
};

export enum TicketPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum TicketCategory {
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  Hvac = 'hvac',
  Other = 'other',
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.Plumbing]: 'Plumbing',
  [TicketCategory.Electrical]: 'Electrical',
  [TicketCategory.Hvac]: 'HVAC',
  [TicketCategory.Other]: 'Other',
};

export enum DocumentStatus {
  Valid = 'valid',
  Expiring = 'expiring',
  Expired = 'expired',
}

export enum EntityType {
  Property = 'property',
  Unit = 'unit',
  Tenant = 'tenant',
  Lease = 'lease',
  Ticket = 'ticket',
}

export enum DocumentType {
  LeaseAgreement = 'lease_agreement',
  LeaseRenewal = 'lease_renewal',
  OccupancyLetter = 'occupancy_letter',
  OccupancyConfirmation = 'occupancy_confirmation',
  UnitHandover = 'unit_handover',
  TenantForm = 'tenant_form',
  TenantInformation = 'tenant_information',
  PaymentInstruction = 'payment_instruction',
  RentPaymentInstruction = 'rent_payment_instruction',
  NationalId = 'national_id',
  FireCertificate = 'fire_certificate',
  Insurance = 'insurance',
  UtilityBill = 'utility_bill',
  Contract = 'contract',
}

export const DOCUMENT_TYPE_LABELS: Partial<Record<DocumentType, string>> = {
  [DocumentType.LeaseAgreement]: 'Lease agreement',
  [DocumentType.LeaseRenewal]: 'Lease renewal',
  [DocumentType.OccupancyLetter]: 'Occupancy letter',
  [DocumentType.OccupancyConfirmation]: 'Occupancy confirmation',
  [DocumentType.UnitHandover]: 'Unit handover',
  [DocumentType.TenantForm]: 'Tenant form',
  [DocumentType.TenantInformation]: 'Tenant form',
  [DocumentType.PaymentInstruction]: 'Payment instruction',
  [DocumentType.RentPaymentInstruction]: 'Payment instruction',
  [DocumentType.NationalId]: 'National ID',
  [DocumentType.FireCertificate]: 'Fire certificate',
  [DocumentType.Insurance]: 'Insurance',
  [DocumentType.UtilityBill]: 'Utility bill',
  [DocumentType.Contract]: 'Contract',
};

export const VAULT_DOCUMENT_TYPES = [
  DocumentType.LeaseAgreement,
  DocumentType.LeaseRenewal,
  DocumentType.OccupancyLetter,
  DocumentType.UnitHandover,
  DocumentType.TenantForm,
  DocumentType.PaymentInstruction,
  DocumentType.NationalId,
  DocumentType.FireCertificate,
  DocumentType.Insurance,
  DocumentType.UtilityBill,
  DocumentType.Contract,
] as const;

export const AGREEMENT_DOC_TYPES = [
  DocumentType.LeaseAgreement,
  DocumentType.LeaseRenewal,
  DocumentType.OccupancyLetter,
  DocumentType.UnitHandover,
  DocumentType.TenantForm,
  DocumentType.PaymentInstruction,
] as const;

export enum ArrearsBucket {
  Days1To30 = '1-30 days',
  Days31To60 = '31-60 days',
  Days61To90 = '61-90 days',
  Days90Plus = '90+ days',
}

export const ARREARS_BUCKET_LABELS: Record<ArrearsBucket, string> = {
  [ArrearsBucket.Days1To30]: '1-30 days',
  [ArrearsBucket.Days31To60]: '31-60 days',
  [ArrearsBucket.Days61To90]: '61-90 days',
  [ArrearsBucket.Days90Plus]: '90+ days',
};

export enum NotificationKind {
  Arrears = 'arrears',
  Compliance = 'compliance',
  Maintenance = 'maintenance',
}

export enum Currency {
  Ghs = 'GHS',
}

export enum PlatformAvailabilityMode {
  Live = 'live',
  Maintenance = 'maintenance',
  ComingSoon = 'coming_soon',
}

export const PLATFORM_AVAILABILITY_MODES = [
  PlatformAvailabilityMode.Live,
  PlatformAvailabilityMode.Maintenance,
  PlatformAvailabilityMode.ComingSoon,
] as const;

export const PLATFORM_AVAILABILITY_LABELS: Record<PlatformAvailabilityMode, string> = {
  [PlatformAvailabilityMode.Live]: 'Live',
  [PlatformAvailabilityMode.Maintenance]: 'Maintenance',
  [PlatformAvailabilityMode.ComingSoon]: 'Coming soon',
};

export enum ConversationType {
  TenantOps = 'tenant_ops',
  OwnerPlatform = 'owner_platform',
}

export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  [ConversationType.TenantOps]: 'Property support',
  [ConversationType.OwnerPlatform]: 'Platform support',
};

export enum AgreementTemplateId {
  LeaseAgreement = 'lease_agreement',
  LeaseRenewal = 'lease_renewal',
  OccupancyConfirmation = 'occupancy_confirmation',
  UnitHandover = 'unit_handover',
  TenantInformation = 'tenant_information',
  RentPaymentInstruction = 'rent_payment_instruction',
}
