import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show and hide with ref counting', () => {
    expect(service.loading()).toBe(false);

    service.show('Loading tenants...');
    expect(service.loading()).toBe(true);
    expect(service.label()).toBe('Loading tenants...');

    service.show('Loading more...');
    expect(service.loading()).toBe(true);
    expect(service.label()).toBe('Loading more...');

    service.hide();
    expect(service.loading()).toBe(true);

    service.hide();
    expect(service.loading()).toBe(false);
    expect(service.label()).toBe('Processing...');
  });

  it('should reset nested loaders', () => {
    service.show('A');
    service.show('B');
    service.reset();
    expect(service.loading()).toBe(false);
  });
});
