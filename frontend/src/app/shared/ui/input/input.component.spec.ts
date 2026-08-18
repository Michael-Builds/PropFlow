import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(component.inputType()).toBe('password');
    component.togglePasswordVisibility();
    expect(component.inputType()).toBe('text');
    component.togglePasswordVisibility();
    expect(component.inputType()).toBe('password');
  });

  it('should render a left icon when provided', () => {
    fixture.componentRef.setInput('leftIcon', 'mail');
    fixture.detectChanges();
    expect(component.leftIcon()).toBe('mail');
  });

  it('should derive a placeholder from the label when none is set', () => {
    fixture.componentRef.setInput('label', 'First name');
    fixture.detectChanges();
    expect(component.resolvedPlaceholder()).toBe('Enter first name');
  });

  it('should prefer an explicit placeholder over the label fallback', () => {
    fixture.componentRef.setInput('label', 'First name');
    fixture.componentRef.setInput('placeholder', 'Ama');
    fixture.detectChanges();
    expect(component.resolvedPlaceholder()).toBe('Ama');
  });
});
