import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { LogoComponent } from '../../../shared/ui/logo/logo.component';

@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent, LogoComponent],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <div class="mb-5 hidden lg:block">
          <app-logo [size]="44" />
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-text-primary">Reset password</h2>
        <p class="mt-1 text-sm text-text-secondary">We’ll email a reset link if the account exists.</p>
      </div>
      <app-input label="Email" type="email" leftIcon="mail" formControlName="email" />
      <app-button type="submit" class="flex! w-full" label="Send reset link" [loading]="submitting()" [disabled]="form.invalid" />
      <p class="text-center text-sm text-text-secondary">
        <a routerLink="/auth/login" class="text-brand hover:underline">Back to sign in</a>
      </p>
    </form>
  `,
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success('If that email exists, a reset link is on the way.');
      },
      error: () => this.submitting.set(false),
    });
  }
}
