import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { AgreementTemplateId, DataCollection, DocumentType } from '../../enums';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../data/data.service';
import { AgreementService } from './agreement.service';
import { completeOwnerLogin, httpTestProviders } from '../../testing/http';

describe('AgreementService', () => {
  let service: AgreementService;
  let data: DataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: httpTestProviders(),
    });
    service = TestBed.inject(AgreementService);
    data = TestBed.inject(DataService);
    http = TestBed.inject(HttpTestingController);
    completeOwnerLogin(http, TestBed.inject(AuthService));
  });

  afterEach(() => http.verify());

  it('fills a lease agreement from tenant and unit records', async () => {
    const pending = firstValueFrom(data.loadCollection<{ id: string; tenant: string }>(DataCollection.Leases));
    http.expectOne((request) => request.url.includes('/leases')).flush({
      items: [{ id: 'lea_002', tenant: 'Ama Boateng', unit: 'A-101', status: 'active', tenantId: 'tnt_001', unitId: 'unt_001' }],
    });
    const leases = await pending;
    const agreement = service.generate({ templateId: AgreementTemplateId.LeaseAgreement, leaseId: leases[0].id });
    expect(agreement.title).toContain('tenancy');
    expect(agreement.tenantName).toBe('Ama Boateng');
    expect(agreement.filename).toContain('lease-agreement');
  });

  it('requires a lease for tenancy templates', () => {
    expect(() => service.generate({ templateId: AgreementTemplateId.LeaseAgreement })).toThrowError(/lease/i);
  });

  it('allows tenant information without a lease when a tenant is provided', async () => {
    const pending = firstValueFrom(data.loadCollection<{ id: string; fullName: string }>(DataCollection.Tenants));
    http.expectOne((request) => request.url.includes('/tenants')).flush({
      items: [{ id: 'tnt_001', fullName: 'Ama Boateng' }],
    });
    const tenants = await pending;
    const agreement = service.generate({
      templateId: AgreementTemplateId.TenantInformation,
      tenantId: tenants[0].id,
    });
    expect(agreement.tenantName).toBe(tenants[0].fullName);
    expect(agreement.documentType).toBe(DocumentType.TenantForm);
  });
});
