import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  let fixture: ComponentFixture<SelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('options', [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should select an option', () => {
    fixture.componentInstance.select({ label: 'Active', value: 'active' });
    expect(fixture.componentInstance.value()).toBe('active');
  });
});
