import { TestBed } from '@angular/core/testing';
import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle collapsed state', () => {
    expect(service.collapsed()).toBe(false);
    service.toggleCollapsed();
    expect(service.collapsed()).toBe(true);
  });

  it('should toggle mobile drawer', () => {
    service.openMobile();
    expect(service.mobileOpen()).toBe(true);
    service.closeMobile();
    expect(service.mobileOpen()).toBe(false);
  });
});
