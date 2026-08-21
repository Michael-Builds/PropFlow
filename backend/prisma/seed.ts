import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { encryptPii } from '../src/common/pii';
import { DEFAULT_COMPLIANCE_PACK } from '../src/compliance/compliance.defaults';

/** Demo seed only. Wipe before production. All passwords: password */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to seed.');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const passwordHash = await bcrypt.hash('password', 10);
  const platformEmail = (process.env.PLATFORM_ADMIN_EMAIL ?? 'platform@propflow.app').toLowerCase();

  const org = await prisma.organization.upsert({
    where: { id: 'org_001' },
    update: { name: 'PropFlow Demo', status: 'active' },
    create: { id: 'org_001', name: 'PropFlow Demo', status: 'active' },
  });
  const org2 = await prisma.organization.upsert({
    where: { id: 'org_002' },
    update: { name: 'Kumasi Heritage Homes', status: 'active' },
    create: { id: 'org_002', name: 'Kumasi Heritage Homes', status: 'active' },
  });

  await prisma.user.upsert({
    where: { email: platformEmail },
    update: { passwordHash, role: 'platform_admin', status: 'active', orgId: null, fullName: 'PropFlow Platform' },
    create: { email: platformEmail, role: 'platform_admin', passwordHash, status: 'active', fullName: 'PropFlow Platform' },
  });

  const staff = [
    { email: 'owner@propflow.app', role: 'owner' as const, fullName: 'Ama Owusu' },
    { email: 'manager@propflow.app', role: 'manager' as const, fullName: 'Yaw Asante' },
    { email: 'finance@propflow.app', role: 'finance' as const, fullName: 'Kwesi Darko' },
    { email: 'vendor@propflow.app', role: 'vendor' as const, fullName: 'AquaFix Ops' },
    { email: 'tenant@propflow.app', role: 'tenant' as const, fullName: 'Ama Boateng' },
    { email: 'owner2@propflow.app', role: 'owner' as const, fullName: 'Akosua Mensah', orgId: org2.id },
  ];
  for (const user of staff) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role, orgId: user.orgId ?? org.id, status: 'active', fullName: user.fullName },
      create: {
        orgId: user.orgId ?? org.id,
        email: user.email,
        role: user.role,
        passwordHash,
        status: 'active',
        fullName: user.fullName,
      },
    });
  }

  const vendor = await prisma.vendor.upsert({
    where: { id: 'vendor_001' },
    update: { name: 'AquaFix Mechanical', status: 'active' },
    create: {
      id: 'vendor_001',
      orgId: org.id,
      name: 'AquaFix Mechanical',
      specialtiesJson: ['plumbing', 'electrical', 'hvac'],
      contactJson: { phone: '+233244111222', email: 'vendor@propflow.app' },
      status: 'active',
    },
  });

  const properties = [
    { id: 'prop_001', name: 'Airport City Residences', location: 'Airport City, Accra', type: 'residential', yearBuilt: 2019, manager: 'Yaw Asante' },
    { id: 'prop_002', name: 'Labone Court', location: 'Labone, Accra', type: 'residential', yearBuilt: 2016, manager: 'Yaw Asante' },
    { id: 'prop_003', name: 'East Legon Villas', location: 'East Legon, Accra', type: 'residential', yearBuilt: 2021, manager: 'Ama Owusu' },
    { id: 'prop_004', name: 'Osu Harbour Offices', location: 'Osu, Accra', type: 'commercial', yearBuilt: 2014, manager: 'Yaw Asante' },
  ];
  for (const property of properties) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: { name: property.name, location: property.location, type: property.type, manager: property.manager, status: 'active' },
      create: { ...property, orgId: org.id, status: 'active' },
    });
  }
  await prisma.property.upsert({
    where: { id: 'prop_101' },
    update: { name: 'Asokwa Gardens', location: 'Asokwa, Kumasi', status: 'active' },
    create: { id: 'prop_101', orgId: org2.id, name: 'Asokwa Gardens', location: 'Asokwa, Kumasi', type: 'residential', yearBuilt: 2018, manager: 'Akosua Mensah', status: 'active' },
  });

  const blocks = [
    { id: 'block_001', propertyId: 'prop_001', name: 'Block A' },
    { id: 'block_002', propertyId: 'prop_001', name: 'Block B' },
    { id: 'block_003', propertyId: 'prop_002', name: 'Court West' },
    { id: 'block_004', propertyId: 'prop_003', name: 'Villa Row' },
    { id: 'block_005', propertyId: 'prop_004', name: 'Floor 2' },
    { id: 'block_101', propertyId: 'prop_101', name: 'Block 1' },
  ];
  for (const block of blocks) {
    await prisma.block.upsert({
      where: { id: block.id },
      update: { name: block.name, status: 'active' },
      create: { ...block, orgId: block.propertyId.startsWith('prop_101') ? org2.id : org.id, status: 'active' },
    });
  }

  const unitDefs = [
    { id: 'unit_001', propertyId: 'prop_001', blockId: 'block_001', unitCode: 'A-12', type: '2-bed', floor: 1, rent: 3500, status: 'occupied' },
    { id: 'unit_002', propertyId: 'prop_001', blockId: 'block_001', unitCode: 'A-13', type: '1-bed', floor: 1, rent: 2200, status: 'vacant' },
    { id: 'unit_003', propertyId: 'prop_001', blockId: 'block_001', unitCode: 'A-14', type: '2-bed', floor: 1, rent: 3600, status: 'occupied' },
    { id: 'unit_004', propertyId: 'prop_001', blockId: 'block_002', unitCode: 'B-21', type: '3-bed', floor: 2, rent: 4800, status: 'occupied' },
    { id: 'unit_005', propertyId: 'prop_001', blockId: 'block_002', unitCode: 'B-22', type: 'studio', floor: 2, rent: 1800, status: 'maintenance' },
    { id: 'unit_006', propertyId: 'prop_002', blockId: 'block_003', unitCode: 'W-01', type: '2-bed', floor: 0, rent: 3100, status: 'occupied' },
    { id: 'unit_007', propertyId: 'prop_002', blockId: 'block_003', unitCode: 'W-02', type: '2-bed', floor: 0, rent: 3100, status: 'occupied' },
    { id: 'unit_008', propertyId: 'prop_002', blockId: 'block_003', unitCode: 'W-03', type: '1-bed', floor: 1, rent: 2400, status: 'vacant' },
    { id: 'unit_009', propertyId: 'prop_003', blockId: 'block_004', unitCode: 'V-1', type: '4-bed', floor: 0, rent: 7200, status: 'occupied' },
    { id: 'unit_010', propertyId: 'prop_003', blockId: 'block_004', unitCode: 'V-2', type: '4-bed', floor: 0, rent: 7400, status: 'occupied' },
    { id: 'unit_011', propertyId: 'prop_003', blockId: 'block_004', unitCode: 'V-3', type: '3-bed', floor: 0, rent: 6100, status: 'occupied' },
    { id: 'unit_012', propertyId: 'prop_004', blockId: 'block_005', unitCode: '2A', type: 'office', floor: 2, rent: 8500, status: 'occupied' },
    { id: 'unit_013', propertyId: 'prop_004', blockId: 'block_005', unitCode: '2B', type: 'office', floor: 2, rent: 7900, status: 'occupied' },
    { id: 'unit_014', propertyId: 'prop_004', blockId: 'block_005', unitCode: '2C', type: 'office', floor: 2, rent: 6400, status: 'vacant' },
    { id: 'unit_101', propertyId: 'prop_101', blockId: 'block_101', unitCode: '1-A', type: '2-bed', floor: 1, rent: 2100, status: 'occupied', orgId: org2.id },
    { id: 'unit_102', propertyId: 'prop_101', blockId: 'block_101', unitCode: '1-B', type: '1-bed', floor: 1, rent: 1500, status: 'vacant', orgId: org2.id },
  ];
  for (const unit of unitDefs) {
    const orgId = unit.orgId ?? org.id;
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: { unitCode: unit.unitCode, type: unit.type, rentAmount: unit.rent, status: unit.status, blockId: unit.blockId },
      create: {
        id: unit.id,
        orgId,
        propertyId: unit.propertyId,
        blockId: unit.blockId,
        unitCode: unit.unitCode,
        type: unit.type,
        floor: unit.floor,
        rentAmount: unit.rent,
        currency: 'GHS',
        status: unit.status,
      },
    });
  }

  const tenantDefs = [
    { id: 'tenant_001', fullName: 'Ama Boateng', email: 'tenant@propflow.app', phone: '+233244100001', occupation: 'Analyst', kyc: 'verified' },
    { id: 'tenant_002', fullName: 'Kofi Mensah', email: 'kofi.mensah@example.com', phone: '+233244100002', occupation: 'Engineer', kyc: 'verified' },
    { id: 'tenant_003', fullName: 'Efua Addo', email: 'efua.addo@example.com', phone: '+233244100003', occupation: 'Designer', kyc: 'verified' },
    { id: 'tenant_004', fullName: 'Nana Yeboah', email: 'nana.yeboah@example.com', phone: '+233244100004', occupation: 'Lawyer', kyc: 'pending' },
    { id: 'tenant_005', fullName: 'Abena Sarpong', email: 'abena.sarpong@example.com', phone: '+233244100005', occupation: 'Teacher', kyc: 'verified' },
    { id: 'tenant_006', fullName: 'Joseph Tetteh', email: 'joseph.tetteh@example.com', phone: '+233244100006', occupation: 'Trader', kyc: 'verified' },
    { id: 'tenant_007', fullName: 'Akua Boateng', email: 'akua.boateng@example.com', phone: '+233244100007', occupation: 'Nurse', kyc: 'verified' },
    { id: 'tenant_008', fullName: 'Daniel Owusu', email: 'daniel.owusu@example.com', phone: '+233244100008', occupation: 'Consultant', kyc: 'verified' },
    { id: 'tenant_009', fullName: 'Selina Darko', email: 'selina.darko@example.com', phone: '+233244100009', occupation: 'Accountant', kyc: 'pending' },
    { id: 'tenant_010', fullName: 'Heritage Labs Ltd', email: 'accounts@heritagelabs.gh', phone: '+233302555010', occupation: 'Company', kyc: 'verified' },
    { id: 'tenant_011', fullName: 'North Ridge Media', email: 'ops@northridge.gh', phone: '+233302555011', occupation: 'Company', kyc: 'verified' },
    { id: 'tenant_101', fullName: 'Yaw Boateng', email: 'yaw.boateng@example.com', phone: '+233244200101', occupation: 'Driver', kyc: 'verified', orgId: org2.id },
  ];
  for (const tenant of tenantDefs) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: {
        fullName: tenant.fullName,
        email: tenant.email,
        status: 'active',
        kycStatus: tenant.kyc,
        phone: encryptPii(tenant.phone),
        emergencyContact: encryptPii('Next of kin · +233200000000'),
      },
      create: {
        id: tenant.id,
        orgId: tenant.orgId ?? org.id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: encryptPii(tenant.phone),
        occupation: tenant.occupation,
        emergencyContact: encryptPii('Next of kin · +233200000000'),
        status: 'active',
        kycStatus: tenant.kyc,
      },
    });
  }

  const leaseDefs = [
    { id: 'lease_001', propertyId: 'prop_001', unitId: 'unit_001', tenantId: 'tenant_001', rent: 3500 },
    { id: 'lease_002', propertyId: 'prop_001', unitId: 'unit_003', tenantId: 'tenant_002', rent: 3600 },
    { id: 'lease_003', propertyId: 'prop_001', unitId: 'unit_004', tenantId: 'tenant_003', rent: 4800 },
    { id: 'lease_004', propertyId: 'prop_002', unitId: 'unit_006', tenantId: 'tenant_005', rent: 3100 },
    { id: 'lease_005', propertyId: 'prop_002', unitId: 'unit_007', tenantId: 'tenant_006', rent: 3100 },
    { id: 'lease_006', propertyId: 'prop_003', unitId: 'unit_009', tenantId: 'tenant_007', rent: 7200 },
    { id: 'lease_007', propertyId: 'prop_003', unitId: 'unit_010', tenantId: 'tenant_008', rent: 7400 },
    { id: 'lease_008', propertyId: 'prop_003', unitId: 'unit_011', tenantId: 'tenant_009', rent: 6100 },
    { id: 'lease_009', propertyId: 'prop_004', unitId: 'unit_012', tenantId: 'tenant_010', rent: 8500 },
    { id: 'lease_010', propertyId: 'prop_004', unitId: 'unit_013', tenantId: 'tenant_011', rent: 7900 },
    { id: 'lease_101', propertyId: 'prop_101', unitId: 'unit_101', tenantId: 'tenant_101', rent: 2100, orgId: org2.id },
  ];
  for (const lease of leaseDefs) {
    const orgId = lease.orgId ?? org.id;
    await prisma.lease.upsert({
      where: { id: lease.id },
      update: { rentAmount: lease.rent, status: 'active' },
      create: {
        id: lease.id,
        orgId,
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        rentAmount: lease.rent,
        dueDay: 5,
        billingCycle: 'monthly',
        status: 'active',
        notes: 'Demo tenancy',
      },
    });
  }

  const invoiceMonths = [
    { start: '2026-05-01', end: '2026-05-31', due: '2026-05-05', paid: true },
    { start: '2026-06-01', end: '2026-06-30', due: '2026-06-05', paid: true },
    { start: '2026-07-01', end: '2026-07-31', due: '2026-07-05', paid: false, overdue: true },
    { start: '2026-08-01', end: '2026-08-31', due: '2026-08-05', paid: false },
  ];
  let invoiceN = 0;
  for (const lease of leaseDefs) {
    const orgId = lease.orgId ?? org.id;
    for (const [index, month] of invoiceMonths.entries()) {
      invoiceN += 1;
      const id = `inv_${String(invoiceN).padStart(3, '0')}`;
      const paid = month.paid && invoiceN % 7 !== 0;
      const amountDue = lease.rent;
      const amountPaid = paid ? amountDue : invoiceN % 5 === 0 ? Math.round(amountDue * 0.4) : 0;
      const balance = amountDue - amountPaid;
      const status = balance <= 0 ? 'paid' : month.overdue ? 'overdue' : amountPaid > 0 ? 'partial' : 'due';
      await prisma.invoice.upsert({
        where: { id },
        update: { amountDue, amountPaid, balance, status },
        create: {
          id,
          orgId,
          leaseId: lease.id,
          tenantId: lease.tenantId,
          periodStart: new Date(month.start),
          periodEnd: new Date(month.end),
          dueDate: new Date(month.due),
          amountDue,
          amountPaid,
          balance,
          currency: 'GHS',
          status,
          notes: `Rent ${month.start.slice(0, 7)}`,
          lastReminderAt: status === 'overdue' ? new Date('2026-08-10') : null,
        },
      });
      if (amountPaid > 0) {
        const payId = `pay_${String(invoiceN).padStart(3, '0')}`;
        await prisma.payment.upsert({
          where: { id: payId },
          update: { amount: amountPaid, status: 'success' },
          create: {
            id: payId,
            orgId,
            invoiceId: id,
            amount: amountPaid,
            feeAmount: 0,
            chargedAmount: amountPaid,
            currency: 'GHS',
            method: invoiceN % 2 === 0 ? 'mobile_money' : 'card',
            provider: 'paystack',
            direction: 'in',
            status: 'success',
            reference: `seed_${payId}`,
            paidAt: new Date(month.due),
          },
        });
      }
      if (status === 'overdue' || status === 'partial') {
        await prisma.arrearsSnapshot.upsert({
          where: { id: `arr_${id}` },
          update: { balance, bucket: status === 'overdue' ? '30' : 'current' },
          create: {
            id: `arr_${id}`,
            orgId,
            tenantId: lease.tenantId,
            leaseId: lease.id,
            invoiceId: id,
            bucket: status === 'overdue' ? '30' : 'current',
            balance,
            snapshotDate: new Date('2026-08-18'),
          },
        });
      }
    }
  }

  const tickets = [
    { id: 'tkt_001', propertyId: 'prop_001', unitId: 'unit_001', tenantId: 'tenant_001', category: 'plumbing', priority: 'high', status: 'open', notes: 'Kitchen tap leaking.' },
    { id: 'tkt_002', propertyId: 'prop_001', unitId: 'unit_004', tenantId: 'tenant_003', category: 'electrical', priority: 'medium', status: 'in_progress', notes: 'Corridor light flickering.' },
    { id: 'tkt_003', propertyId: 'prop_002', unitId: 'unit_006', tenantId: 'tenant_005', category: 'hvac', priority: 'low', status: 'resolved', notes: 'AC filter replaced.' },
    { id: 'tkt_004', propertyId: 'prop_003', unitId: 'unit_009', tenantId: 'tenant_007', category: 'structural', priority: 'urgent', status: 'open', notes: 'Gate hinge failed.' },
    { id: 'tkt_005', propertyId: 'prop_004', unitId: 'unit_012', tenantId: 'tenant_010', category: 'cleaning', priority: 'low', status: 'closed', notes: 'Common area deep clean.' },
    { id: 'tkt_006', propertyId: 'prop_001', unitId: 'unit_005', tenantId: null, category: 'plumbing', priority: 'high', status: 'in_progress', notes: 'Vacant unit bathroom leak.' },
  ];
  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { id: ticket.id },
      update: { status: ticket.status, notes: ticket.notes, vendorId: vendor.id },
      create: {
        id: ticket.id,
        orgId: org.id,
        propertyId: ticket.propertyId,
        unitId: ticket.unitId,
        tenantId: ticket.tenantId,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        slaDueAt: new Date('2026-08-22'),
        vendorId: vendor.id,
        notes: ticket.notes,
        resolvedAt: ticket.status === 'resolved' || ticket.status === 'closed' ? new Date('2026-08-12') : null,
        closedAt: ticket.status === 'closed' ? new Date('2026-08-13') : null,
      },
    });
    await prisma.ticketEvent.upsert({
      where: { id: `${ticket.id}_opened` },
      update: { eventType: 'opened' },
      create: {
        id: `${ticket.id}_opened`,
        orgId: org.id,
        ticketId: ticket.id,
        eventType: 'opened',
        payloadJson: { category: ticket.category },
      },
    });
  }

  const docs = [
    { id: 'doc_001', entityType: 'lease' as const, entityId: 'lease_001', docType: 'lease_agreement' },
    { id: 'doc_002', entityType: 'tenant' as const, entityId: 'tenant_001', docType: 'national_id' },
    { id: 'doc_003', entityType: 'property' as const, entityId: 'prop_001', docType: 'insurance' },
    { id: 'doc_004', entityType: 'lease' as const, entityId: 'lease_006', docType: 'lease_agreement' },
    { id: 'doc_005', entityType: 'unit' as const, entityId: 'unit_012', docType: 'fit_out_approval' },
    { id: 'doc_006', entityType: 'property' as const, entityId: 'prop_001', docType: 'fire_certificate' },
    { id: 'doc_007', entityType: 'tenant' as const, entityId: 'tenant_002', docType: 'national_id' },
    { id: 'doc_008', entityType: 'tenant' as const, entityId: 'tenant_003', docType: 'national_id' },
    { id: 'doc_009', entityType: 'tenant' as const, entityId: 'tenant_005', docType: 'national_id' },
    { id: 'doc_010', entityType: 'tenant' as const, entityId: 'tenant_006', docType: 'national_id' },
    { id: 'doc_011', entityType: 'tenant' as const, entityId: 'tenant_007', docType: 'national_id' },
    { id: 'doc_012', entityType: 'tenant' as const, entityId: 'tenant_008', docType: 'national_id' },
    { id: 'doc_013', entityType: 'tenant' as const, entityId: 'tenant_010', docType: 'national_id' },
    { id: 'doc_014', entityType: 'tenant' as const, entityId: 'tenant_011', docType: 'national_id' },
    { id: 'doc_015', entityType: 'tenant' as const, entityId: 'tenant_101', docType: 'national_id', orgId: org2.id },
  ];
  for (const doc of docs) {
    await prisma.document.upsert({
      where: { id: doc.id },
      update: { status: 'valid', docType: doc.docType },
      create: {
        id: doc.id,
        orgId: doc.orgId ?? org.id,
        entityType: doc.entityType,
        entityId: doc.entityId,
        docType: doc.docType,
        fileUrl: `https://files.propflow.local/${doc.id}.pdf`,
        expiresAt: new Date('2027-01-01'),
        status: 'valid',
      },
    });
  }

  for (const orgId of [org.id, org2.id]) {
    for (const rule of DEFAULT_COMPLIANCE_PACK) {
      await prisma.complianceRule.upsert({
        where: {
          orgId_entityType_docType: {
            orgId,
            entityType: rule.entityType,
            docType: rule.docType,
          },
        },
        create: { orgId, ...rule },
        update: { required: rule.required, validityDays: rule.validityDays },
      });
    }
  }

  const users = await prisma.user.findMany({ where: { orgId: org.id } });
  let n = 0;
  for (const user of users) {
    n += 1;
    await prisma.notification.upsert({
      where: { id: `ntf_${user.role}_${n}` },
      update: { status: 'sent' },
      create: {
        id: `ntf_${user.role}_${n}`,
        orgId: org.id,
        userId: user.id,
        channel: 'in_app',
        type: user.role === 'finance' ? 'invoice_overdue' : user.role === 'vendor' ? 'ticket_assigned' : 'welcome',
        payloadJson: { message: `Welcome to the PropFlow demo workspace, ${user.fullName}.` },
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      { id: 'aud_001', orgId: org.id, action: 'SEED', entityType: 'organization', entityId: org.id, afterJson: { name: org.name } },
      { id: 'aud_002', orgId: org.id, action: 'CREATE', entityType: 'lease', entityId: 'lease_001', afterJson: { unit: 'A-12' } },
      { id: 'aud_003', orgId: org.id, action: 'CREATE', entityType: 'invoice', entityId: 'inv_001', afterJson: { status: 'paid' } },
    ],
    skipDuplicates: true,
  });

  await prisma.user.update({
    where: { email: 'tenant@propflow.app' },
    data: { tenantId: 'tenant_001' },
  });
  await prisma.user.update({
    where: { email: 'vendor@propflow.app' },
    data: { vendorId: vendor.id },
  });

  console.log('Seeded demo orgs org_001 / org_002 with portfolio, invoices, payments, tickets, and users (password: password)');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
