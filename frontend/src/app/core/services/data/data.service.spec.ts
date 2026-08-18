import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { DataCollection } from '../../enums/data-collection.enum';
import { DataService } from './data.service';
import { httpTestProviders } from '../../testing/http';

describe('DataService', () => {
  let service: DataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: httpTestProviders(),
    });
    service = TestBed.inject(DataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a collection from the API', async () => {
    const pending = firstValueFrom(service.loadCollection<{ id: string }>(DataCollection.Tenants));
    const req = http.expectOne((request) => request.url.includes('/tenants'));
    req.flush({ items: [{ id: 'tnt_001', fullName: 'Ama Boateng' }] });
    const items = await pending;
    expect(items[0]?.id).toBe('tnt_001');
  });

  it('should load dashboard payload from the API', async () => {
    const pending = firstValueFrom(service.loadDashboard<{ kpis?: unknown[] }>());
    const req = http.expectOne((request) => request.url.includes('/dashboard/overview'));
    req.flush({ kpis: [{ label: 'Occupancy' }] });
    const payload = await pending;
    expect(Array.isArray(payload.kpis)).toBe(true);
  });

  it('should find a record by id', async () => {
    const pending = firstValueFrom(service.getById<{ id: string }>(DataCollection.Tenants, 'tnt_001'));
    const req = http.expectOne((request) => request.url.includes('/tenants/tnt_001'));
    req.flush({ id: 'tnt_001', fullName: 'Ama Boateng' });
    const found = await pending;
    expect(found?.id).toBe('tnt_001');
  });

  it('should create and update a record', async () => {
    const createdPending = firstValueFrom(
      service.create(DataCollection.Properties, { name: 'Labone Court', location: 'Labone' }),
    );
    http.expectOne((request) => request.url.includes('/properties') && request.method === 'POST').flush({
      id: 'prp_100',
      name: 'Labone Court',
    });
    const created = await createdPending;
    expect(created['id']).toBe('prp_100');

    const updatedPending = firstValueFrom(
      service.update(DataCollection.Properties, 'prp_100', { name: 'Labone Court', occupancy: '100%' }),
    );
    http.expectOne((request) => request.url.includes('/properties/prp_100') && request.method === 'PATCH').flush({
      id: 'prp_100',
      occupancy: '100%',
    });
    const updated = await updatedPending;
    expect(updated?.['occupancy']).toBe('100%');
  });
});
