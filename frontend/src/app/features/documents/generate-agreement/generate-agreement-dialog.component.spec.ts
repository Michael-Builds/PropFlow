import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '../../../core/icons/app-icons';
import { AuthService } from '../../../core/services/auth/auth.service';
import { GenerateAgreementDialogComponent } from './generate-agreement-dialog.component';
import { completeOwnerLogin, httpTestProviders } from '../../../core/testing/http';
import { HttpTestingController } from '@angular/common/http/testing';

describe('GenerateAgreementDialogComponent', () => {
  let fixture: ComponentFixture<GenerateAgreementDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateAgreementDialogComponent],
      providers: [provideIcons(APP_ICONS), ...httpTestProviders()],
    }).compileComponents();

    completeOwnerLogin(TestBed.inject(HttpTestingController), TestBed.inject(AuthService));
    fixture = TestBed.createComponent(GenerateAgreementDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
