import { Injectable, inject } from '@angular/core';
import { AGREEMENT_TEMPLATES, agreementTemplateById, agreementTemplateFromQuery } from '../../config/agreement-templates';
import {
  AgreementTemplate,
  AgreementTemplateId,
  GenerateAgreementInput,
  GeneratedAgreement,
} from '../../interfaces/agreement.interface';
import { formatDisplayDate, prettyLabel } from '../../utils';
import { AuthService } from '../auth/auth.service';
import { DataService, RecordRow } from '../data/data.service';
import { downloadAgreementPdf } from './agreement-pdf';

type MergeValues = Record<string, string>;

const LEASE_STATUS_RANK: Record<string, number> = {
  active: 0,
  ending: 1,
  pending: 2,
  terminated: 3,
};

@Injectable({ providedIn: 'root' })
export class AgreementService {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);

  templates(): AgreementTemplate[] {
    return AGREEMENT_TEMPLATES;
  }

  leaseOptions(): { label: string; value: string }[] {
    return this.data
      .listSync('leases')
      .map((lease) => ({
        value: String(lease['id'] ?? ''),
        label: [
          String(lease['tenant'] ?? 'Tenant'),
          String(lease['unit'] ?? 'Unit'),
          prettyLabel(String(lease['status'] ?? '')),
        ]
          .filter(Boolean)
          .join(' · '),
      }))
      .filter((option) => option.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  resolveLease(
    leaseId?: string | null,
    tenantId?: string | null,
    unitId?: string | null,
  ): RecordRow | null {
    if (leaseId) return this.data.findSync('leases', leaseId);
    if (!tenantId && !unitId) return null;
    const matches = this.data.listSync('leases').filter((lease) => {
      const tenantOk = !tenantId || lease['tenantId'] === tenantId;
      const unitOk = !unitId || lease['unitId'] === unitId;
      return tenantOk && unitOk;
    });
    return (
      [...matches].sort((a, b) => {
        const rankA = LEASE_STATUS_RANK[String(a['status'] ?? '')] ?? 9;
        const rankB = LEASE_STATUS_RANK[String(b['status'] ?? '')] ?? 9;
        return rankA - rankB;
      })[0] ?? null
    );
  }

  generate(input: GenerateAgreementInput): GeneratedAgreement {
    const template = agreementTemplateById(input.templateId);
    if (!template) {
      throw new Error('Unknown agreement template.');
    }

    const lease = this.resolveLease(input.leaseId, input.tenantId, input.unitId);
    if (template.requiresLease && !lease) {
      throw new Error('Select a lease so the form can fill tenant, unit, and rent.');
    }

    const tenantId = String(lease?.['tenantId'] ?? input.tenantId ?? '');
    const tenant = tenantId ? this.data.findSync('tenants', tenantId) : null;
    const unit = lease?.['unitId'] ? this.data.findSync('units', String(lease['unitId'])) : null;
    const propertyId = String(lease?.['propertyId'] ?? unit?.['propertyId'] ?? '');
    const property = propertyId ? this.data.findSync('properties', propertyId) : null;
    const values = this.mergeValues(lease, tenant, unit, property, input.extraTerms);
    const extraTerms = input.extraTerms?.trim() || null;
    const sections = template.sections.map((section) => ({
      heading: fill(section.heading, values),
      paragraphs: section.paragraphs.map((paragraph) => fill(paragraph, values)),
    }));

    if (extraTerms) {
      sections.push({
        heading: 'Additional terms',
        paragraphs: [extraTerms],
      });
    }

    const tenantName = values['tenantName'] || 'Tenant';
    const unitLabel = values['unitCode'] || '';
    const propertyName = values['propertyName'] || '';
    const issuedAt = new Date().toISOString();

    return {
      templateId: template.id,
      title: template.title,
      subtitle: [tenantName, unitLabel, propertyName].filter(Boolean).join(' · '),
      filename: fileName(template, tenantName, unitLabel),
      issuedAt,
      issuedBy: values['generatedBy'],
      leaseId: lease ? String(lease['id']) : null,
      tenantId: tenantId || null,
      tenantName,
      unitLabel,
      propertyName,
      entityLabel: [tenantName, unitLabel].filter(Boolean).join(' · ') || tenantName,
      documentType: template.documentType,
      expiresAt: lease ? String(lease['endDate'] ?? '') || null : null,
      parties: this.parties(values, lease),
      sections,
      signatures: template.signatureRoles.map((role) => ({
        role,
        name: role.toLowerCase().includes('tenant') ? tenantName : values['landlordName'],
      })),
      extraTerms,
    };
  }

  async download(agreement: GeneratedAgreement): Promise<void> {
    await downloadAgreementPdf(agreement);
  }

  saveToVault(agreement: GeneratedAgreement): RecordRow {
    const today = agreement.issuedAt.slice(0, 10);
    return this.data.create('documents', {
      entityId: agreement.leaseId ?? agreement.tenantId ?? '',
      entityType: agreement.leaseId ? 'lease' : 'tenant',
      entity: agreement.entityLabel,
      type: agreement.documentType,
      expiresAt: agreement.expiresAt ?? '',
      status: 'valid',
      uploadedAt: today,
      generated: true,
      templateId: agreement.templateId,
      leaseId: agreement.leaseId,
      tenantId: agreement.tenantId,
    });
  }

  isTemplateId(value: string | null | undefined): value is AgreementTemplateId {
    return !!agreementTemplateFromQuery(value);
  }

  resolveTemplateId(value: string | null | undefined): AgreementTemplateId {
    return agreementTemplateFromQuery(value)?.id ?? 'lease_agreement';
  }

  private parties(values: MergeValues, lease: RecordRow | null): GeneratedAgreement['parties'] {
    const rows: GeneratedAgreement['parties'] = [
      { label: 'Tenant', value: values['tenantName'] },
      { label: 'Landlord / issued for', value: values['landlordName'] },
      { label: 'Property', value: `${values['propertyName']}, ${values['propertyAddress']}` },
      { label: 'Unit', value: values['unitCode'] },
    ];
    if (lease) {
      rows.push(
        { label: 'Lease', value: values['leaseId'] },
        { label: 'Term', value: `${values['startDate']} – ${values['endDate']}` },
        { label: 'Rent', value: values['rent'] },
      );
    }
    return rows;
  }

  private mergeValues(
    lease: RecordRow | null,
    tenant: RecordRow | null,
    unit: RecordRow | null,
    property: RecordRow | null,
    extraTerms?: string | null,
  ): MergeValues {
    const user = this.auth.user();
    const landlordName =
      user?.role === 'owner'
        ? user.fullName
        : user
          ? `${user.fullName}, manager acting for the owner`
          : 'the recorded property owner';

    return {
      generatedAt: formatDisplayDate(new Date().toISOString()),
      generatedBy: user?.fullName ?? 'PropFlow operator',
      landlordName,
      extraTerms: extraTerms?.trim() || 'None recorded.',
      tenantName: text(tenant, 'fullName', text(lease, 'tenant')),
      tenantEmail: text(tenant, 'email'),
      tenantPhone: text(tenant, 'phone'),
      tenantOccupation: text(tenant, 'occupation'),
      tenantEmergency: text(tenant, 'emergencyContact'),
      unitCode: text(unit, 'unitCode', text(lease, 'unit')),
      unitType: text(unit, 'type'),
      unitFloor: text(unit, 'floor'),
      unitSqm: text(unit, 'sqm'),
      rent: text(lease, 'rent', text(unit, 'rent')),
      leaseId: text(lease, 'id'),
      leaseStatus: prettyLabel(text(lease, 'status')),
      startDate: formatMaybeDate(text(lease, 'startDate')),
      endDate: formatMaybeDate(text(lease, 'endDate')),
      propertyName: text(property, 'name', text(unit, 'property')),
      propertyAddress: text(property, 'address', text(property, 'location')),
      propertyType: text(property, 'type'),
      propertyManager: text(property, 'manager'),
    };
  }
}

function text(row: RecordRow | null, key: string, fallback = ''): string {
  const value = row?.[key];
  if (value == null || value === '') return fallback;
  return String(value);
}

function formatMaybeDate(value: string): string {
  if (!value || value === '___________') return value;
  return formatDisplayDate(value);
}

function fill(template: string, values: MergeValues): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key]?.trim();
    return value ? value : '___________';
  });
}

function fileName(template: AgreementTemplate, tenantName: string, unitLabel: string): string {
  const parts = ['propflow', template.id, tenantName, unitLabel].filter(Boolean);
  return (
    parts
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[_\s]+/g, '-') || 'propflow-agreement'
  );
}
