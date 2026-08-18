import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/app/core/mock');
const ghs = (n) => `GHS ${n.toLocaleString('en-GH')}`;
const pad = (p, i) => `${p}_${String(i).padStart(3, '0')}`;
const iso = (d) => d.toISOString().slice(0, 10);
const stamp = (d) => d.toISOString().slice(0, 16).replace('T', ' ');
const pick = (arr, i) => arr[i % arr.length];

const propertySeeds = [
  ['Airport Hills Court', 'East Legon, Accra', 24],
  ['Cantonments Grove', 'Cantonments, Accra', 12],
  ['Tema Community 25', 'Tema', 36],
  ['Labone Residences', 'Labone, Accra', 16],
  ['Ridge Heights', 'Ridge, Accra', 20],
  ['Osu Anchor Court', 'Osu, Accra', 14],
  ['Dzorwulu Place', 'Dzorwulu, Accra', 18],
  ['Spintex Harbour', 'Spintex, Accra', 28],
  ['Kumasi Asokwa Park', 'Asokwa, Kumasi', 22],
  ['Takoradi Beach Walk', 'Beach Road, Takoradi', 10],
  ['Madina Green', 'Madina, Accra', 32],
  ['Achimota Square', 'Achimota, Accra', 15],
  ['Dansoman Courts', 'Dansoman, Accra', 26],
  ['Adenta Lakeside', 'Adenta, Accra', 19],
  ['Cape Coast Harbour', 'Cape Coast', 11],
  ['Tamale Civic', 'Tamale', 13],
  ['East Legon Hills', 'East Legon Hills, Accra', 21],
  ['Airport Residential', 'Airport Residential, Accra', 9],
];

const first = ['Ama', 'Kojo', 'Efua', 'Yaw', 'Akosua', 'Kwesi', 'Abena', 'Kofi', 'Adwoa', 'Kwame', 'Akua', 'Fiifi', 'Nana', 'Esi', 'Kwabena', 'Aba'];
const last = ['Boateng', 'Mensah', 'Sarpong', 'Owusu', 'Asante', 'Darko', 'Appiah', 'Osei', 'Agyeman', 'Addo', 'Frimpong', 'Nkrumah', 'Quaye', 'Tetteh', 'Ansah', 'Baffoe'];
const types = ['studio', '1 bed', '2 bed', '3 bed'];
const rents = [1200, 1800, 2500, 3200, 4200, 5500];
const managers = ['Yaw Asante', 'Ama Owusu', 'Akosua Appiah', 'Kofi Osei'];
const vendors = ['AquaFix Ltd', 'CoolAir', 'VoltWorks', 'BuildRight', 'Unassigned'];
const actors = ['Ama Owusu', 'Yaw Asante', 'Kwesi Darko'];
const methods = ['bank_transfer', 'mobile_money', 'cash'];
const ticketCats = ['plumbing', 'electrical', 'hvac', 'other'];
const ticketStatus = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
const priorities = ['high', 'medium', 'low'];
const docTypes = ['national_id', 'lease_agreement', 'fire_certificate', 'insurance', 'utility_bill'];
const ntfTypes = ['arrears', 'compliance', 'maintenance', 'lease'];

const properties = propertySeeds.map(([name, location, units], i) => ({
  id: pad('prp', i + 1),
  name,
  location,
  units,
  occupancy: `${68 + ((i * 7) % 28)}%`,
  status: i === 15 ? 'inactive' : 'active',
  type: i % 3 === 0 ? 'Apartment' : i % 3 === 1 ? 'Townhouse' : 'Mixed use',
  manager: pick(managers, i),
  yearBuilt: 2008 + (i % 16),
  address: location,
  createdAt: `2024-${String((i % 12) + 1).padStart(2, '0')}-12`,
}));

const units = [];
let unitN = 1;
for (const property of properties) {
  const count = Math.max(3, Math.min(4, Math.round(property.units / 7)));
  for (let u = 0; u < count; u++) {
    const type = pick(types, unitN);
    const rent = pick(rents, unitN + u);
    const status = unitN % 11 === 0 ? 'maintenance' : unitN % 5 === 0 ? 'vacant' : 'occupied';
    units.push({
      id: pad('unt', unitN),
      propertyId: property.id,
      property: property.name,
      unitCode: `${String.fromCharCode(65 + (u % 4))}-${String(100 + u + (unitN % 9)).padStart(3, '0')}`,
      type,
      rent: ghs(rent),
      rentValue: rent,
      status,
      floor: (u % 6) + 1,
      sqm: 32 + (unitN % 70),
    });
    unitN += 1;
  }
}

const tenants = Array.from({ length: 42 }, (_, i) => {
  const fn = pick(first, i);
  const ln = pick(last, i + 3);
  return {
    id: pad('tnt', i + 1),
    fullName: `${fn} ${ln}`,
    email: `${fn}.${ln}${i + 1}@email.com`.toLowerCase(),
    phone: `+233 ${20 + (i % 8)} ${String(100 + i).slice(-3)} ${String(2200 + i).slice(-4)}`,
    kycStatus: i % 6 === 0 ? 'pending' : 'verified',
    status: i === 40 ? 'inactive' : 'active',
    occupation: pick(['Banker', 'Trader', 'Engineer', 'Teacher', 'Consultant', 'Nurse'], i),
    emergencyContact: `+233 24 ${String(800 + i).slice(-3)} ${String(1100 + i).slice(-4)}`,
    joinedAt: iso(new Date(Date.UTC(2023, i % 12, 4 + (i % 20)))),
  };
});

const occupied = units.filter((u) => u.status === 'occupied');
const leases = occupied.slice(0, 40).map((unit, i) => {
  const tenant = tenants[i % tenants.length];
  const start = new Date(Date.UTC(2025, i % 12, 1));
  const end = new Date(Date.UTC(2026 + (i % 2), i % 12, 28));
  const ending = end < new Date('2026-10-01');
  return {
    id: pad('lea', i + 1),
    tenantId: tenant.id,
    tenant: tenant.fullName,
    unitId: unit.id,
    unit: unit.unitCode,
    propertyId: unit.propertyId,
    startDate: iso(start),
    endDate: iso(end),
    rent: unit.rent,
    rentValue: unit.rentValue,
    status: i % 17 === 0 ? 'terminated' : ending ? 'ending' : 'active',
  };
});

const periods = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
const invoices = [];
let invN = 1;
for (const lease of leases) {
  const n = 1 + (invN % 2);
  for (let p = 0; p < n && invN <= 60; p++) {
    const amount = lease.rentValue;
    const status = invN % 7 === 0 ? 'overdue' : invN % 5 === 0 ? 'partial' : 'paid';
    const balance = status === 'paid' ? 0 : status === 'partial' ? Math.round(amount * 0.35) : amount;
    invoices.push({
      id: pad('inv', invN),
      tenantId: lease.tenantId,
      tenant: lease.tenant,
      leaseId: lease.id,
      period: pick(periods, invN),
      dueDate: `2026-${String((invN % 8) + 1).padStart(2, '0')}-05`,
      amount: ghs(amount),
      amountValue: amount,
      balance: ghs(balance),
      balanceValue: balance,
      status,
    });
    invN += 1;
  }
}

const payments = invoices
  .filter((inv) => inv.status !== 'overdue')
  .slice(0, 52)
  .map((inv, i) => {
    const paid = inv.status === 'paid' ? inv.amountValue : inv.amountValue - inv.balanceValue;
    return {
      id: pad('pay', i + 1),
      invoiceId: inv.id,
      tenantId: inv.tenantId,
      tenant: inv.tenant,
      amount: ghs(paid),
      method: pick(methods, i),
      reference: i % 3 === 0 ? `MM-${44000 + i}` : `TRX-${88000 + i}`,
      paidAt: iso(new Date(Date.UTC(2026, i % 8, 3 + (i % 20)))),
    };
  });

const arrears = leases.slice(0, 24).map((lease, i) => {
  const overdue = i % 3 !== 0;
  const balance = overdue ? pick([1500, 1200, 2500, 4200, 800], i) : 900;
  return {
    id: pad('arr', i + 1),
    tenantId: lease.tenantId,
    tenant: lease.tenant,
    lease: lease.id,
    invoiceId: pad('inv', (i % 60) + 1),
    bucket: i % 4 === 0 ? '61-90 days' : i % 2 ? '31-60 days' : '1-30 days',
    balance: ghs(balance),
    lastReminder: iso(new Date(Date.UTC(2026, 7, 8 + (i % 10)))),
  };
});

const tickets = Array.from({ length: 36 }, (_, i) => {
  const unit = pick(units, i + 2);
  return {
    id: pad('tck', i + 1),
    unitId: unit.id,
    unit: unit.unitCode,
    propertyId: unit.propertyId,
    category: pick(ticketCats, i),
    priority: pick(priorities, i),
    assignee: pick(vendors, i),
    status: pick(ticketStatus, i),
    slaDue: stamp(new Date(Date.UTC(2026, 7, 18 + (i % 8), 9 + (i % 8)))),
    openedAt: stamp(new Date(Date.UTC(2026, 7, 10 + (i % 8), 8))),
  };
});

const documents = Array.from({ length: 34 }, (_, i) => {
  const useProperty = i % 4 === 0;
  const entity = useProperty ? pick(properties, i) : pick(tenants, i);
  const type = useProperty ? pick(['fire_certificate', 'insurance'], i) : pick(docTypes, i);
  const status = i % 9 === 0 ? 'expired' : i % 5 === 0 ? 'expiring' : 'valid';
  return {
    id: pad('doc', i + 1),
    entityId: entity.id,
    entityType: useProperty ? 'property' : 'tenant',
    entity: entity.name ?? entity.fullName,
    type,
    expiresAt: iso(new Date(Date.UTC(status === 'expired' ? 2025 : 2026, status === 'expiring' ? 8 : 11, 10 + (i % 18)))),
    status,
    uploadedAt: iso(new Date(Date.UTC(2025, i % 12, 6))),
  };
});

const notifications = Array.from({ length: 30 }, (_, i) => ({
  id: pad('ntf', i + 1),
  title: pick(
    ['Arrears reminder queued', 'Document expiring', 'Ticket SLA warning', 'Lease ending soon', 'Payment posted'],
    i,
  ),
  message: pick(
    [
      'Kojo Mensah · 1-30 days · GHS 1,500',
      'Fire certificate expires in 10 days',
      'Plumbing ticket is due today',
      'Efua Sarpong lease ends 30 Sep',
      'Ama Boateng · GHS 2,500 received',
    ],
    i + 1,
  ),
  type: pick(ntfTypes, i),
  read: i % 3 === 0,
  createdAt: stamp(new Date(Date.UTC(2026, 7, 12 + (i % 7), 7 + (i % 10)))),
}));

const auditLogs = Array.from({ length: 48 }, (_, i) => ({
  id: pad('aud', i + 1),
  actor: pick(actors, i),
  action: pick(
    ['POST /leases', 'POST /payments', 'PATCH /tickets', 'POST /invoices', 'PATCH /tenants', 'POST /documents'],
    i,
  ),
  entity: pick(
    [...leases.map((x) => x.id), ...payments.map((x) => x.id), ...tickets.map((x) => x.id)],
    i,
  ),
  ip: `102.176.10.${20 + (i % 40)}`,
  createdAt: stamp(new Date(Date.UTC(2026, 7, 1 + (i % 18), 8 + (i % 10), i % 60))),
}));

const files = {
  'properties.json': properties,
  'units.json': units,
  'tenants.json': tenants,
  'leases.json': leases,
  'invoices.json': invoices,
  'payments.json': payments,
  'arrears.json': arrears,
  'tickets.json': tickets,
  'documents.json': documents,
  'notifications.json': notifications,
  'audit-logs.json': auditLogs,
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${name}: ${data.length}`);
}
