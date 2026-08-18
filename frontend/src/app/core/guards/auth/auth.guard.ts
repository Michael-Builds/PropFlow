import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NAV_SECTIONS } from '../../config/nav.config';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.authenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const path = '/' + state.url.split('?')[0].split('/').filter(Boolean)[0];
  const item = NAV_SECTIONS.flatMap((section) => section.items).find(
    (nav) => nav.path === path || nav.path === state.url.split('?')[0],
  );
  if (item && !auth.canAccess(item.roles)) {
    return router.createUrlTree([auth.homePath()]);
  }
  return true;
};
