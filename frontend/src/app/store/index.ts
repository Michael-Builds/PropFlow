import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from '../../environments/environment';
import { AuthEffects } from './auth/auth.effects';
import { authFeature } from './auth/auth.reducer';
import { CollectionsEffects } from './collections/collections.effects';
import { collectionsFeature } from './collections/collections.reducer';
import { DashboardEffects } from './dashboard/dashboard.effects';
import { dashboardFeature } from './dashboard/dashboard.reducer';

export function provideAppStore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideStore(),
    provideState(authFeature),
    provideState(collectionsFeature),
    provideState(dashboardFeature),
    provideEffects(AuthEffects, CollectionsEffects, DashboardEffects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
  ]);
}
