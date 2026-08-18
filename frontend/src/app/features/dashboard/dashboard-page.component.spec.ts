import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPageComponent } from './dashboard-page.component';
import { httpTestProviders } from '../../core/testing/http';

describe('DashboardPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter([]), ...httpTestProviders()],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
