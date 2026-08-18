import { TestBed } from '@angular/core/testing';
import { DetailStatsComponent } from './detail-stats.component';

describe('DetailStatsComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailStatsComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailStatsComponent);
    fixture.componentRef.setInput('stats', [{ label: 'Units', value: '24' }]);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
