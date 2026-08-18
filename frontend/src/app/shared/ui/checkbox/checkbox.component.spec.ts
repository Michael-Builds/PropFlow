import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  let fixture: ComponentFixture<CheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle checked state', () => {
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.value()).toBe(true);
  });
});
