import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartComponent } from './chart.component';

describe('ChartComponent', () => {
  let fixture: ComponentFixture<ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartComponent);
    fixture.componentRef.setInput('labels', ['A', 'B']);
    fixture.componentRef.setInput('datasets', [{ data: [1, 2], color: '#0028f2' }]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
