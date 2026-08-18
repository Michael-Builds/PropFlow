import { Routes } from '@angular/router';
import { DataCollection } from './core/interfaces/data.interface';
import { authGuard } from './core/guards/auth/auth.guard';
import { guestGuard } from './core/guards/guest/guest.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

const collections: DataCollection[] = [
  'properties',
  'units',
  'tenants',
  'leases',
  'invoices',
  'payments',
  'arrears',
  'tickets',
  'documents',
  'notifications',
  'audit-logs',
];

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    component: AuthLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login-page.component').then((m) => m.LoginPageComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'appearance',
        loadComponent: () =>
          import('./features/appearance/appearance-page.component').then((m) => m.AppearancePageComponent),
      },
      ...collections.map((collection) => ({
        path: collection,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/collection/collection-page.component').then((m) => m.CollectionPageComponent),
            data: { collection },
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/collection/detail/collection-detail-page.component').then(
                (m) => m.CollectionDetailPageComponent,
              ),
            data: { collection },
          },
        ],
      })),
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
