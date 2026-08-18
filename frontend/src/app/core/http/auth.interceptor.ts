import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }
  const auth = inject(AuthService);
  const headers: Record<string, string> = {};
  const token = auth.accessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const orgId = auth.activeOrgId();
  if (auth.role() === 'platform_admin' && orgId) {
    headers['x-org-id'] = orgId;
  }
  return next(req.clone({ setHeaders: headers }));
};
