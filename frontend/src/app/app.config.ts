import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import { routes } from './app.routes';
import { APP_ICONS } from './core/icons/app-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideNgIconsConfig({ size: '1em' }),
    provideIcons(APP_ICONS),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
  ],
};
