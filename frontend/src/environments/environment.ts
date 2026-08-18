import { API_ORIGIN, API_VERSION, buildApiBaseUrl, type AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiOrigin: API_ORIGIN,
  apiVersion: API_VERSION,
  apiBaseUrl: buildApiBaseUrl(API_ORIGIN, API_VERSION),
};
