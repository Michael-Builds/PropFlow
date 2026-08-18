import { AgreementTemplateId } from '../enums/domain.enum';

export { AgreementTemplateId };

export interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

export interface AgreementTemplate {
  id: AgreementTemplateId;
  title: string;
  description: string;
  documentType: string;
  requiresLease: boolean;
  sections: AgreementSection[];
  signatureRoles: string[];
}

export interface AgreementPartyBlock {
  label: string;
  value: string;
}

export interface AgreementSignature {
  role: string;
  name: string;
}

export interface GeneratedAgreement {
  templateId: AgreementTemplateId;
  title: string;
  subtitle: string;
  filename: string;
  issuedAt: string;
  issuedBy: string;
  leaseId: string | null;
  tenantId: string | null;
  tenantName: string;
  unitLabel: string;
  propertyName: string;
  entityLabel: string;
  documentType: string;
  expiresAt: string | null;
  parties: AgreementPartyBlock[];
  sections: AgreementSection[];
  signatures: AgreementSignature[];
  extraTerms: string | null;
}

export interface GenerateAgreementInput {
  templateId: AgreementTemplateId;
  leaseId?: string | null;
  tenantId?: string | null;
  unitId?: string | null;
  extraTerms?: string | null;
}
