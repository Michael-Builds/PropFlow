export const API_ORIGIN = 'https://antelope-mutilated-chosen.ngrok-free.dev';
export const API_VERSION = 'v1';

export interface AppEnvironment {
  production: boolean;
  apiOrigin: string;
  apiVersion: string;
  apiBaseUrl: string;
}

export function buildApiBaseUrl(origin: string, version: string): string {
  return `${origin.replace(/\/$/, '')}/api/${version}`;
}
