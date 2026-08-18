import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../data/data.service';
import { AgreementService } from './agreement.service';

describe('AgreementService', () => {
  let service: AgreementService;
  let data: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgreementService);
    data = TestBed.inject(DataService);
    const auth = TestBed.inject(AuthService);
    auth.login('owner@propflow.app', 'password');
  });

  it('fills a lease agreement from tenant and unit records', async () => {
    const leases = await firstValueFrom(data.loadCollection<{ id: string; tenant: string }>('leases'));
    const active = leases.find((lease) => lease.id === 'lea_002') ?? leases[0];
    const agreement = service.generate({ templateId: 'lease_agreement', leaseId: active.id });
    expect(agreement.title).toContain('tenancy');
    expect(agreement.tenantName).toBe(active.tenant);
    expect(agreement.sections[0]?.paragraphs[0]).toContain('PropFlow');
    expect(agreement.filename).toContain('lease-agreement');
  });

  it('requires a lease for tenancy templates', () => {
    expect(() => service.generate({ templateId: 'lease_agreement' })).toThrowError(/lease/i);
  });

  it('allows tenant information without a lease when a tenant is provided', async () => {
    const tenants = await firstValueFrom(data.loadCollection<{ id: string; fullName: string }>('tenants'));
    const agreement = service.generate({
      templateId: 'tenant_information',
      tenantId: tenants[0].id,
    });
    expect(agreement.tenantName).toBe(tenants[0].fullName);
    expect(agreement.documentType).toBe('tenant_form');
  });
});
