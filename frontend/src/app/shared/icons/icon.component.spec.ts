import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { IconComponent } from './icon.component';
import { APP_ICONS } from '../../core/icons/app-icons';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideIcons(APP_ICONS)],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'dashboard');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
