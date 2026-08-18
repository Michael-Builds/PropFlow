import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('label', 'Tenants');
    fixture.componentRef.setInput('value', '24');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
