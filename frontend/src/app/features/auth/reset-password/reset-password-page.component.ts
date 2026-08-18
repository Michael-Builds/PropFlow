import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { LogoComponent } from '../../../shared/ui/logo/logo.component';

@Component({
  selector: 'app-reset-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent, LogoComponent],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <div class="mb-5 hidden lg:block">
          <app-logo [size]="44" />
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-text-primary">Choose a new password</h2>
        <p class="mt-1 text-sm text-text-secondary">Use at least 8 characters.</p>
      </div>
      <app-input label="New password" type="password" leftIcon="lock" formControlName="password" />
      <app-button type="submit" class="flex! w-full" label="Update password" [loading]="submitting()" [disabled]="form.invalid" />
      <p class="text-center text-sm text-text-secondary">
        <a routerLink="/auth/login" class="text-brand hover:underline">Back to sign in</a>
      </p>
    </form>
  `,
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      if (!this.token) this.toast.error('This reset link is missing a token.');
      return;
    }
    this.submitting.set(true);
    this.auth.resetPassword(this.token, this.form.controls.password.value).subscribe({
      next: (result) => {
        this.submitting.set(false);
        if (!result.ok) {
          this.toast.error(result.message ?? 'Unable to reset password.');
          return;
        }
        this.toast.success('Password updated. Sign in with the new password.');
        void this.router.navigateByUrl('/auth/login');
      },
      error: () => this.submitting.set(false),
    });
  }
}
