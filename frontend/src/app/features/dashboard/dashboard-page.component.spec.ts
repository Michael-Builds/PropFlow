import { TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
