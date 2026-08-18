import { AgreementTemplate, AgreementTemplateId } from '../interfaces/agreement.interface';

export const AGREEMENT_TEMPLATES: AgreementTemplate[] = [
  {
    id: 'lease_agreement',
    title: 'Residential tenancy agreement',
    description: 'Standard lease filled from the tenant, unit, rent, and term on file.',
    documentType: 'lease_agreement',
    requiresLease: true,
    signatureRoles: ['Landlord / owner', 'Tenant'],
    sections: [
      {
        heading: '1. Parties and premises',
        paragraphs: [
          'This residential tenancy agreement is generated from the PropFlow operator file on {{generatedAt}} by {{generatedBy}}.',
          'The landlord (or the landlord’s authorised manager) is {{landlordName}}. The tenant is {{tenantName}}, contact {{tenantEmail}} / {{tenantPhone}}.',
          'The premises are Unit {{unitCode}} ({{unitType}}, floor {{unitFloor}}, {{unitSqm}} m²) at {{propertyName}}, {{propertyAddress}}.',
        ],
      },
      {
        heading: '2. Term',
        paragraphs: [
          'The tenancy recorded on lease {{leaseId}} starts on {{startDate}} and ends on {{endDate}}, unless ended earlier in writing or renewed by a later instrument.',
          'Current lease status on file: {{leaseStatus}}.',
        ],
      },
      {
        heading: '3. Rent and payment',
        paragraphs: [
          'Contract rent is {{rent}} per calendar month, payable in Ghana Cedis (GHS) in advance through the invoices issued in PropFlow.',
          'Gateway or mobile-money fees charged by the payment provider are borne by the tenant at checkout, unless the owner records a different arrangement.',
          'Late or missed rent is tracked as arrears in the operator file. This agreement is not an eviction notice.',
        ],
      },
      {
        heading: '4. Use, access, and upkeep',
        paragraphs: [
          'The tenant shall use the unit as a private dwelling, keep it in a clean and tenantable state, and report defects through the maintenance desk.',
          'The landlord (or manager) may inspect the unit on reasonable notice, except in emergency. Structural repairs remain the landlord’s responsibility unless caused by the tenant’s neglect or misuse.',
        ],
      },
      {
        heading: '5. Ending and handover',
        paragraphs: [
          'At the end of the term the tenant shall return the unit with keys and fittings, complete a handover record, and settle outstanding invoices.',
          'Any extra terms recorded by the operator at generation are attached below and form part of this file copy.',
        ],
      },
    ],
  },
  {
    id: 'lease_renewal',
    title: 'Lease renewal addendum',
    description: 'Extends an existing tenancy using the current rent and unit on file.',
    documentType: 'lease_renewal',
    requiresLease: true,
    signatureRoles: ['Landlord / owner', 'Tenant'],
    sections: [
      {
        heading: '1. Existing tenancy',
        paragraphs: [
          'This addendum is generated on {{generatedAt}} by {{generatedBy}} and refers to lease {{leaseId}} between {{landlordName}} and {{tenantName}}.',
          'The premises remain Unit {{unitCode}} at {{propertyName}}, {{propertyAddress}}.',
        ],
      },
      {
        heading: '2. Renewal',
        paragraphs: [
          'The parties agree to continue the tenancy from {{startDate}} through {{endDate}} at the recorded rent of {{rent}} per month, unless a different amount is written into the extra terms.',
          'All other terms of the original residential tenancy remain in force except as varied here.',
        ],
      },
    ],
  },
  {
    id: 'occupancy_confirmation',
    title: 'Occupancy confirmation letter',
    description: 'Letter confirming the named tenant occupies the unit for the recorded term.',
    documentType: 'occupancy_letter',
    requiresLease: true,
    signatureRoles: ['Authorised signatory'],
    sections: [
      {
        heading: 'Confirmation',
        paragraphs: [
          'To whom it may concern.',
          'This letter confirms that {{tenantName}} occupies Unit {{unitCode}} at {{propertyName}}, {{propertyAddress}}, under lease {{leaseId}}.',
          'The recorded term is {{startDate}} to {{endDate}}. Contract rent on file is {{rent}} per month. Lease status: {{leaseStatus}}.',
          'This confirmation is issued from the PropFlow operator file on {{generatedAt}} by {{generatedBy}}. It is not a credit reference or a guarantee of future occupancy.',
        ],
      },
    ],
  },
  {
    id: 'unit_handover',
    title: 'Unit handover and inventory',
    description: 'Condition and keys checklist at move-in or move-out, prefilled from the unit record.',
    documentType: 'unit_handover',
    requiresLease: true,
    signatureRoles: ['Landlord / manager', 'Tenant'],
    sections: [
      {
        heading: '1. Property and parties',
        paragraphs: [
          'Handover for Unit {{unitCode}} ({{unitType}}, floor {{unitFloor}}, {{unitSqm}} m²) at {{propertyName}}, {{propertyAddress}}.',
          'Tenant: {{tenantName}}. Lease: {{leaseId}}. Generated {{generatedAt}} by {{generatedBy}}.',
        ],
      },
      {
        heading: '2. Inventory checklist',
        paragraphs: [
          'Mark each item as present and in serviceable condition, or note defects in extra terms: entrance door and locks; windows and keys; kitchen fittings; sanitary ware; electrical outlets and lighting; smoke or fire equipment where fitted.',
          'Meter readings and outstanding utility accounts should be recorded before keys are released or returned.',
          'The tenant acknowledges receiving (or returning) the unit in the condition described in this form, subject to fair wear and tear.',
        ],
      },
    ],
  },
  {
    id: 'tenant_information',
    title: 'Tenant information form',
    description: 'KYC-style form prefilled from the tenant profile for signature and file.',
    documentType: 'tenant_form',
    requiresLease: false,
    signatureRoles: ['Tenant', 'Received by'],
    sections: [
      {
        heading: '1. Personal details',
        paragraphs: [
          'Full name: {{tenantName}}. Email: {{tenantEmail}}. Phone: {{tenantPhone}}.',
          'Occupation: {{tenantOccupation}}. Emergency contact: {{tenantEmergency}}.',
          'Linked unit (if a lease is on file): {{unitCode}} at {{propertyName}}, {{propertyAddress}}.',
        ],
      },
      {
        heading: '2. Declaration',
        paragraphs: [
          'The tenant confirms that the details above match the identity documents to be stored in the PropFlow vault, and will notify the operator of changes.',
          'Form generated on {{generatedAt}} by {{generatedBy}}. This is an operational record, not a substitute for government ID.',
        ],
      },
    ],
  },
  {
    id: 'rent_payment_instruction',
    title: 'Rent payment instruction',
    description: 'How the tenant should pay invoices issued for this lease, including gateway fees.',
    documentType: 'payment_instruction',
    requiresLease: true,
    signatureRoles: ['Issued by'],
    sections: [
      {
        heading: 'Payment instruction',
        paragraphs: [
          'Tenant {{tenantName}} should pay rent for Unit {{unitCode}} at {{propertyName}} against invoices generated in PropFlow for lease {{leaseId}}.',
          'Recorded monthly rent is {{rent}}, due as stated on each invoice. Pay only through the official checkout or pay link so receipts post to the operator ledger.',
          'Card, mobile money, or bank-transfer fees charged by the payment provider are paid by the tenant at checkout.',
          'Do not send rent to personal numbers or accounts that are not shown on a PropFlow invoice. Issued {{generatedAt}} by {{generatedBy}}.',
        ],
      },
    ],
  },
];

export const AGREEMENT_DOCUMENT_TYPE_TO_TEMPLATE: Record<string, AgreementTemplateId> = {
  lease_agreement: 'lease_agreement',
  lease_renewal: 'lease_renewal',
  occupancy_letter: 'occupancy_confirmation',
  unit_handover: 'unit_handover',
  tenant_form: 'tenant_information',
  payment_instruction: 'rent_payment_instruction',
};

export function agreementTemplateById(id: string | null | undefined): AgreementTemplate | null {
  if (!id) return null;
  return AGREEMENT_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function agreementTemplateFromQuery(value: string | null | undefined): AgreementTemplate | null {
  if (!value || value === '1') return null;
  return agreementTemplateById(value) ?? agreementTemplateById(AGREEMENT_DOCUMENT_TYPE_TO_TEMPLATE[value]);
}

export const AGREEMENT_TEMPLATE_IDS: AgreementTemplateId[] = AGREEMENT_TEMPLATES.map(
  (template) => template.id,
);
