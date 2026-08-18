import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to seed.');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  const passwordHash = await bcrypt.hash('password', 10);

  const org = await prisma.organization.upsert({
    where: { id: 'org_001' },
    update: { name: 'PropFlow Demo', status: 'active' },
    create: { id: 'org_001', name: 'PropFlow Demo', status: 'active' },
  });

  const platformEmail = (process.env.PLATFORM_ADMIN_EMAIL ?? 'platform@propflow.app').toLowerCase();
  await prisma.user.upsert({
    where: { email: platformEmail },
    update: { passwordHash, role: 'platform_admin', status: 'active', orgId: null, fullName: 'PropFlow Platform' },
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

  console.log('Seeded org org_001, platform admin, and demo users (password: password)');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
