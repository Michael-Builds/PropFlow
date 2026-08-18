import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '../../../core/icons/app-icons';
import { AuthService } from '../../../core/services/auth/auth.service';
import { GenerateAgreementDialogComponent } from './generate-agreement-dialog.component';

describe('GenerateAgreementDialogComponent', () => {
  let fixture: ComponentFixture<GenerateAgreementDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateAgreementDialogComponent],
      providers: [provideIcons(APP_ICONS)],
    }).compileComponents();

    TestBed.inject(AuthService).login('owner@propflow.app', 'password');
    fixture = TestBed.createComponent(GenerateAgreementDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
