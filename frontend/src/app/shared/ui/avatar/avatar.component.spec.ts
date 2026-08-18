import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('initials', 'BA');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render initials with custom colors', () => {
    fixture.componentRef.setInput('bgColor', '#ffffff');
    fixture.componentRef.setInput('textColor', '#000000');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(el.textContent?.trim()).toBe('BA');
    expect(el.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(el.style.color).toBe('rgb(0, 0, 0)');
  });
});
