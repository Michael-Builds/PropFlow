import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthResponse } from '../../core/api/auth-api.service';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ response: AuthResponse }>(),
    'Login Failure': props<{ message: string }>(),
    'Forgot Password': props<{ email: string }>(),
    'Forgot Password Success': emptyProps(),
    'Reset Password': props<{ token: string; password: string }>(),
    'Reset Password Success': emptyProps(),
    'Reset Password Failure': props<{ message: string }>(),
    Logout: props<{ refreshToken: string | null; accessToken: string | null }>(),
    'Logout Success': emptyProps(),
    'Refresh Success': props<{ response: AuthResponse }>(),
    'Set Active Org': props<{ orgId: string }>(),
  },
});
