import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DashboardData } from '../../core/interfaces/dashboard.interface';

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ data: DashboardData }>(),
    'Load Failure': props<{ error: string }>(),
    Clear: emptyProps(),
  },
});
