import { createFeature, createReducer, on } from '@ngrx/store';
import { DashboardData } from '../../core/interfaces/dashboard.interface';
import { DashboardActions } from './dashboard.actions';
import { AuthActions } from '../auth/auth.actions';

export type DashboardStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface DashboardState {
  data: DashboardData | null;
  status: DashboardStatus;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  status: 'idle',
  error: null,
};

const dashboardReducer = createReducer(
  initialState,
  on(DashboardActions.load, (state) => ({ ...state, status: 'loading' as const, error: null })),
  on(DashboardActions.loadSuccess, (_state, { data }) => ({ data, status: 'loaded' as const, error: null })),
  on(DashboardActions.loadFailure, (state, { error }) => ({ ...state, status: 'error' as const, error })),
  on(DashboardActions.clear, AuthActions.logoutSuccess, AuthActions.setActiveOrg, () => initialState),
);

export const dashboardFeature = createFeature({
  name: 'dashboard',
  reducer: dashboardReducer,
});
