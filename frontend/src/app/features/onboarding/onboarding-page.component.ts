import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { OnboardingService } from '../../core/services/onboarding/onboarding.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { OnboardingStatus } from '../../core/api/onboarding-api.service';
import { UserRole } from '../../core/enums/user-role.enum';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { IconComponent } from '../../shared/icons/icon.component';

type StepId = 'password' | 'profile' | 'property' | 'finish';

@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    CardComponent,
    ButtonComponent,
    InputComponent,
    IconComponent,
  ],
  templateUrl: './onboarding-page.component.html',
  styleUrl: './onboarding-page.component.css',
  host: { class: 'block space-y-5' },
})
export class OnboardingPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly status = signal<OnboardingStatus | null>(null);
  readonly step = signal<StepId>('password');

  readonly isOwner = computed(() => this.auth.user()?.role === UserRole.Owner);
  readonly orgName = computed(
    () => this.status()?.organization?.name || this.auth.user()?.orgName || 'your company',
  );

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    address: ['', [Validators.required, Validators.minLength(3)]],
    city: [''],
    country: ['GH'],
  });

  readonly propertyForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.required, Validators.minLength(2)]],
    type: ['residential'],
  });

  readonly steps = computed(() => {
    const s = this.status();
    return [
      { id: 'password' as const, label: 'Secure account', done: s?.steps.password ?? false },
      { id: 'profile' as const, label: 'Company profile', done: s?.steps.profile ?? false },
      { id: 'property' as const, label: 'First property', done: s?.steps.property ?? false },
      { id: 'finish' as const, label: 'Go live', done: s?.onboardingComplete ?? false },
    ];
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.onboarding.status().subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
        if (status.organization) {
          this.profileForm.patchValue({
            name: status.organization.name ?? '',
            phone: status.organization.phone ?? '',
            address: status.organization.address ?? '',
            city: status.organization.city ?? '',
            country: status.organization.country ?? 'GH',
          });
        }
        this.step.set(this.nextIncomplete(status));
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load onboarding status.');
      },
    });
  }

  selectStep(id: StepId): void {
    if (!this.isOwner() && id !== 'password') return;
    this.step.set(id);
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { password, confirm } = this.passwordForm.getRawValue();
    if (password !== confirm) {
      this.toast.error('Passwords do not match.');
      return;
    }
    this.saving.set(true);
    this.onboarding.setPassword(password).subscribe({
      next: (status) => {
        this.saving.set(false);
        this.status.set(status);
        this.toast.success('Password updated.');
        this.step.set(this.nextIncomplete(status));
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Could not update password.');
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.onboarding.saveProfile(this.profileForm.getRawValue()).subscribe({
      next: (status) => {
        this.saving.set(false);
        this.status.set(status);
        this.toast.success('Company profile saved.');
        this.step.set(this.nextIncomplete(status));
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Could not save profile.');
      },
    });
  }

  saveProperty(): void {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.onboarding.addFirstProperty(this.propertyForm.getRawValue()).subscribe({
      next: (status) => {
        this.saving.set(false);
        this.status.set(status);
        this.toast.success('First property added.');
        this.step.set(this.nextIncomplete(status));
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Could not add property.');
      },
    });
  }

  finish(): void {
    this.saving.set(true);
    this.onboarding.complete().subscribe({
      next: (status) => {
        this.saving.set(false);
        this.status.set(status);
        this.toast.success('Onboarding complete. Welcome to PropFlow.');
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message ?? 'Finish the remaining steps first.');
      },
    });
  }

  private nextIncomplete(status: OnboardingStatus): StepId {
    if (!status.steps.password) return 'password';
    if (!this.isOwner()) return 'password';
    if (!status.steps.profile) return 'profile';
    if (!status.steps.property) return 'property';
    return 'finish';
  }
}
