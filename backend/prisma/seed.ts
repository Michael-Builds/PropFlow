import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to seed.');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  const passwordHash = await bcrypt.hash('password', 10);

  const org = await prisma.organization.upsert({
    where: { id: 'org_001' },
    update: { name: 'PropFlow Demo', status: 'active' },
    create: { id: 'org_001', name: 'PropFlow Demo', status: 'active' },
  });

  const platformEmail = (
    process.env.PLATFORM_ADMIN_EMAIL ?? 'platform@propflow.app'
  ).toLowerCase();
  await prisma.user.upsert({
    where: { email: platformEmail },
    update: {
      passwordHash,
      role: 'platform_admin',
      status: 'active',
      orgId: null,
      fullName: 'PropFlow Platform',
    },
    create: {
      email: platformEmail,
      role: 'platform_admin',
      passwordHash,
      status: 'active',
      fullName: 'PropFlow Platform',
    },
  });

  const users: {
    email: string;
    role: 'owner' | 'manager' | 'finance' | 'vendor' | 'tenant';
    fullName: string;
  }[] = [
    { email: 'owner@propflow.app', role: 'owner', fullName: 'Ama Owusu' },
    { email: 'manager@propflow.app', role: 'manager', fullName: 'Yaw Asante' },
    { email: 'finance@propflow.app', role: 'finance', fullName: 'Kwesi Darko' },
    { email: 'vendor@propflow.app', role: 'vendor', fullName: 'AquaFix Ops' },
    { email: 'tenant@propflow.app', role: 'tenant', fullName: 'Ama Boateng' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        role: user.role,
        orgId: org.id,
        status: 'active',
        fullName: user.fullName,
      },
      create: {
        orgId: org.id,
        email: user.email,
        role: user.role,
        passwordHash,
        status: 'active',
        fullName: user.fullName,
      },
    });
  }

  const property = await prisma.property.upsert({
    where: { id: 'prop_001' },
    update: {
      name: 'Airport City Residences',
      location: 'Airport City, Accra',
      type: 'residential',
      manager: 'Yaw Asante',
      status: 'active',
    },
    create: {
      id: 'prop_001',
      orgId: org.id,
      name: 'Airport City Residences',
      location: 'Airport City, Accra',
      type: 'residential',
      manager: 'Yaw Asante',
      yearBuilt: 2019,
      status: 'active',
    },
  });

  const block = await prisma.block.upsert({
    where: { id: 'block_001' },
    update: { name: 'Block A', status: 'active' },
    create: {
      id: 'block_001',
      orgId: org.id,
      propertyId: property.id,
      name: 'Block A',
      status: 'active',
    },
  });

  const occupiedUnit = await prisma.unit.upsert({
    where: { id: 'unit_001' },
    update: {
      unitCode: 'A-12',
      type: '2-bed',
      rentAmount: 3500,
      status: 'occupied',
      blockId: block.id,
    },
    create: {
      id: 'unit_001',
      orgId: org.id,
      propertyId: property.id,
      blockId: block.id,
      unitCode: 'A-12',
      type: '2-bed',
      floor: 1,
      rentAmount: 3500,
      currency: 'GHS',
      status: 'occupied',
    },
  });

  await prisma.unit.upsert({
    where: { id: 'unit_002' },
    update: {
      unitCode: 'A-13',
      type: '1-bed',
      rentAmount: 2200,
      status: 'vacant',
      blockId: block.id,
    },
    create: {
      id: 'unit_002',
      orgId: org.id,
      propertyId: property.id,
      blockId: block.id,
      unitCode: 'A-13',
      type: '1-bed',
      floor: 1,
      rentAmount: 2200,
      currency: 'GHS',
      status: 'vacant',
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant_001' },
    update: {
      fullName: 'Ama Boateng',
      email: 'tenant@propflow.app',
      status: 'active',
      kycStatus: 'verified',
    },
    create: {
      id: 'tenant_001',
      orgId: org.id,
      fullName: 'Ama Boateng',
      email: 'tenant@propflow.app',
      occupation: 'Analyst',
      status: 'active',
      kycStatus: 'verified',
    },
  });

  await prisma.lease.upsert({
    where: { id: 'lease_001' },
    update: {
      rentAmount: 3500,
      status: 'active',
      notes: 'Demo lease for Airport City A-12',
    },
    create: {
      id: 'lease_001',
      orgId: org.id,
      propertyId: property.id,
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentAmount: 3500,
      dueDay: 5,
      billingCycle: 'monthly',
      status: 'active',
      notes: 'Demo lease for Airport City A-12',
    },
  });

  console.log(
    'Seeded org org_001, platform admin, demo users, and sample portfolio (password: password)',
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
