import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
