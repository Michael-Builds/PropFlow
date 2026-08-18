import { TestBed } from '@angular/core/testing';
import { DetailTimelineComponent } from './detail-timeline.component';

describe('DetailTimelineComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [DetailTimelineComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DetailTimelineComponent);
    fixture.componentRef.setInput('events', []);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
