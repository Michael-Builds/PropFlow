import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = environment.apiBaseUrl;
  if (!req.url.startsWith(apiBase) && !req.url.startsWith('/api/')) {
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
