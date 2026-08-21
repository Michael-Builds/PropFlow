import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { documentStatus } from '../common/document-status';
import { UpsertComplianceRuleDto } from './dto/upsert-compliance-rule.dto';
import { DEFAULT_COMPLIANCE_PACK } from './compliance.defaults';

export { DEFAULT_COMPLIANCE_PACK } from './compliance.defaults';

export type ComplianceGap = {
  entityType: EntityType;
  entityId: string;
  docType: string;
  reason: 'missing' | 'expired' | 'expiring';
  expiresAt: string | null;
};

type DocRow = {
  entityType: EntityType;
  entityId: string;
  docType: string;
  expiresAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listRules(orgId: string) {
    await this.ensureDefaults(orgId);
    return this.prisma.complianceRule.findMany({
      where: { orgId },
      orderBy: [{ entityType: 'asc' }, { docType: 'asc' }],
    });
  }

  async ensureDefaults(orgId: string) {
    const existing = await this.prisma.complianceRule.count({ where: { orgId } });
    if (existing > 0) return this.prisma.complianceRule.findMany({ where: { orgId } });

    for (const rule of DEFAULT_COMPLIANCE_PACK) {
      await this.prisma.complianceRule.upsert({
        where: {
          orgId_entityType_docType: {
            orgId,
            entityType: rule.entityType,
            docType: rule.docType,
          },
        },
        create: { orgId, ...rule },
        update: {
          required: rule.required,
          validityDays: rule.validityDays,
        },
      });
    }
    return this.prisma.complianceRule.findMany({
      where: { orgId },
      orderBy: [{ entityType: 'asc' }, { docType: 'asc' }],
    });
  }

  async upsert(orgId: string, dto: UpsertComplianceRuleDto) {
    return this.prisma.complianceRule.upsert({
      where: {
        orgId_entityType_docType: {
          orgId,
          entityType: dto.entityType,
          docType: dto.docType,
        },
      },
      create: {
        orgId,
        entityType: dto.entityType,
        docType: dto.docType,
        required: dto.required ?? true,
        validityDays: dto.validityDays ?? null,
      },
      update: {
        ...(dto.required !== undefined ? { required: dto.required } : {}),
        ...(dto.validityDays !== undefined ? { validityDays: dto.validityDays } : {}),
      },
    });
  }

  async remove(orgId: string, id: string) {
    const row = await this.prisma.complianceRule.findFirst({ where: { id, orgId } });
    if (!row) throw new NotFoundException('Compliance rule not found.');
    await this.prisma.complianceRule.delete({ where: { id } });
    return { ok: true };
  }

  async orgScore(orgId: string): Promise<{ score: number; gaps: number; checked: number }> {
    await this.ensureDefaults(orgId);
    const rules = await this.prisma.complianceRule.findMany({
      where: { orgId, required: true },
    });

    if (rules.length === 0) {
      const docs = await this.prisma.document.findMany({
        where: { orgId },
        select: { expiresAt: true },
      });
      if (docs.length === 0) return { score: 100, gaps: 0, checked: 0 };
      const valid = docs.filter((d) => documentStatus(d.expiresAt) === 'valid').length;
      return {
        score: Math.round((valid / docs.length) * 100),
        gaps: docs.length - valid,
        checked: docs.length,
      };
    }

    const neededTypes = [...new Set(rules.map((r) => r.entityType))];
    const [entities, docs] = await Promise.all([
      this.entityIdsByType(orgId, neededTypes),
      this.prisma.document.findMany({
        where: {
          orgId,
          entityType: { in: neededTypes },
        },
        select: {
          entityType: true,
          entityId: true,
          docType: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);

    const index = this.indexDocs(docs);
    let checked = 0;
    let gaps = 0;
    for (const rule of rules) {
      const ids = entities[rule.entityType] ?? [];
      for (const entityId of ids) {
        checked += 1;
        if (this.gapFromIndex(index, rule.entityType, entityId, rule.docType)) {
          gaps += 1;
        }
      }
    }
    const score = checked === 0 ? 100 : Math.round(((checked - gaps) / checked) * 100);
    return { score, gaps, checked };
  }

  async evaluateEntity(
    orgId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<ComplianceGap[]> {
    const [rules, docs] = await Promise.all([
      this.prisma.complianceRule.findMany({
        where: { orgId, entityType, required: true },
      }),
      this.prisma.document.findMany({
        where: { orgId, entityType, entityId },
        select: {
          entityType: true,
          entityId: true,
          docType: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
    ]);
    const index = this.indexDocs(docs);
    const gaps: ComplianceGap[] = [];
    for (const rule of rules) {
      const gap = this.gapFromIndex(index, entityType, entityId, rule.docType);
      if (gap) gaps.push(gap);
    }
    return gaps;
  }

  async assertLeaseReady(orgId: string, tenantId: string) {
    await this.ensureDefaults(orgId);
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId, orgId } });
    if (!tenant) throw new NotFoundException('Tenant not found.');
    if (tenant.kycStatus !== 'verified') {
      return {
        ok: false as const,
        message: 'Tenant KYC must be verified before creating a lease (regulatory onboarding).',
        gaps: [] as ComplianceGap[],
      };
    }
    const gaps = (await this.evaluateEntity(orgId, 'tenant', tenantId)).filter(
      (g) => g.reason === 'missing' || g.reason === 'expired',
    );
    if (gaps.length > 0) {
      return {
        ok: false as const,
        message: `Tenant is missing required compliance documents: ${gaps.map((g) => g.docType).join(', ')}.`,
        gaps,
      };
    }
    return { ok: true as const, message: null, gaps: [] as ComplianceGap[] };
  }

  private indexDocs(docs: DocRow[]): Map<string, DocRow[]> {
    const map = new Map<string, DocRow[]>();
    for (const doc of docs) {
      const key = this.docKey(doc.entityType, doc.entityId, doc.docType);
      const list = map.get(key);
      if (list) list.push(doc);
      else map.set(key, [doc]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return map;
  }

  private docKey(entityType: EntityType, entityId: string, docType: string): string {
    return `${entityType}:${entityId}:${docType}`;
  }

  private gapFromIndex(
    index: Map<string, DocRow[]>,
    entityType: EntityType,
    entityId: string,
    docType: string,
  ): ComplianceGap | null {
    const docs = index.get(this.docKey(entityType, entityId, docType)) ?? [];
    if (docs.length === 0) {
      return { entityType, entityId, docType, reason: 'missing', expiresAt: null };
    }
    const hasValid = docs.some((d) => documentStatus(d.expiresAt) === 'valid');
    if (hasValid) return null;
    const latest = docs[0];
    const status = documentStatus(latest.expiresAt);
    if (status === 'expired') {
      return {
        entityType,
        entityId,
        docType,
        reason: 'expired',
        expiresAt: latest.expiresAt?.toISOString() ?? null,
      };
    }
    if (status === 'expiring') {
      return {
        entityType,
        entityId,
        docType,
        reason: 'expiring',
        expiresAt: latest.expiresAt?.toISOString() ?? null,
      };
    }
    return null;
  }

  private async entityIdsByType(
    orgId: string,
    needed: Iterable<EntityType> = ['property', 'unit', 'tenant', 'lease'],
  ): Promise<Record<EntityType, string[]>> {
    const want = new Set(needed);
    const [properties, units, tenants, leases] = await Promise.all([
      want.has('property')
        ? this.prisma.property.findMany({ where: { orgId }, select: { id: true } })
        : Promise.resolve([] as Array<{ id: string }>),
      want.has('unit')
        ? this.prisma.unit.findMany({ where: { orgId }, select: { id: true } })
        : Promise.resolve([] as Array<{ id: string }>),
      want.has('tenant')
        ? this.prisma.tenant.findMany({ where: { orgId }, select: { id: true } })
        : Promise.resolve([] as Array<{ id: string }>),
      want.has('lease')
        ? this.prisma.lease.findMany({
            where: { orgId, status: { in: ['active', 'ending'] } },
            select: { id: true },
          })
        : Promise.resolve([] as Array<{ id: string }>),
    ]);
    return {
      property: properties.map((r) => r.id),
      unit: units.map((r) => r.id),
      tenant: tenants.map((r) => r.id),
      lease: leases.map((r) => r.id),
      ticket: [],
    };
  }
}
