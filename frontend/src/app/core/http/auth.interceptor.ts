import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
  };
  const token = auth.accessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const orgId = auth.activeOrgId();
  if (orgId) headers['x-org-id'] = orgId;
  return next(req.clone({ setHeaders: headers }));
};

function isApiRequest(url: string): boolean {
  return (
    url.startsWith(environment.apiBaseUrl) ||
    url.startsWith(`${environment.apiOrigin}/api/`) ||
    url.startsWith('/api/')
  );
}
