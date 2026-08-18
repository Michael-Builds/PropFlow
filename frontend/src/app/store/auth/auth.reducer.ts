import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState, toSessionUser } from './auth.models';

const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({
    ...state,
    status: 'authenticating' as const,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { response }) => {
    const user = toSessionUser(response.user);
    return {
      ...state,
      user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      activeOrgId: user.role === 'platform_admin' ? state.activeOrgId : user.orgId,
      status: 'idle' as const,
      error: null,
    };
  }),
  on(AuthActions.loginFailure, (state, { message }) => ({
    ...state,
    status: 'error' as const,
    error: message,
  })),
  on(AuthActions.logout, AuthActions.logoutSuccess, () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    activeOrgId: null,
    status: 'idle' as const,
    error: null,
  })),
  on(AuthActions.setActiveOrg, (state, { orgId }) => ({
    ...state,
    activeOrgId: orgId,
  })),
  on(AuthActions.resetPasswordFailure, (state, { message }) => ({
    ...state,
    error: message,
  })),
);

export const authFeature = createFeature({
  name: 'auth',
  reducer: authReducer,
});
