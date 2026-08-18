import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should default to atlantic', () => {
    expect(service.theme()).toBe('atlantic');
  });

  it('should persist the selected theme', () => {
    service.setTheme('forest');
    expect(service.theme()).toBe('forest');
    expect(localStorage.getItem('propflow.theme')).toBe('forest');
  });
});
