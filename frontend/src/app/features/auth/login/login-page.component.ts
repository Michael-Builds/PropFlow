import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { InputComponent } from '../../../shared/ui/input/input.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['owner@propflow.app', [Validators.required, Validators.email]],
    password: ['password', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    const result = this.auth.login(email, password);
    this.submitting.set(false);
    if (!result.ok) {
      this.toast.error(result.message ?? 'Unable to sign in.');
      return;
    }
    this.toast.success('Welcome back to PropFlow.');
    void this.router.navigateByUrl(this.auth.homePath());
  }
}
