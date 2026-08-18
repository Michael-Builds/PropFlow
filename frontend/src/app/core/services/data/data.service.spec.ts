import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load a collection from local mock data', async () => {
    const items = await firstValueFrom(service.loadCollection<{ id: string }>('tenants'));
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.id).toBeTruthy();
  });

  it('should load dashboard payload from local mock data', async () => {
    const payload = await firstValueFrom(service.loadDashboard<{ kpis?: unknown[] }>());
    expect(payload).toBeTruthy();
    expect(Array.isArray(payload.kpis)).toBe(true);
  });

  it('should find a record by id', async () => {
    const tenants = await firstValueFrom(service.loadCollection<{ id: string }>('tenants'));
    const found = await firstValueFrom(service.getById('tenants', tenants[0].id));
    expect(found?.id).toBe(tenants[0].id);
  });

  it('should create and update a record', async () => {
    const created = service.create('properties', { name: 'Labone Court', location: 'Labone', units: 8 });
    expect(created['id']).toBeTruthy();
    const updated = service.update('properties', String(created['id']), { occupancy: '100%' });
    expect(updated?.['occupancy']).toBe('100%');
  });
});
