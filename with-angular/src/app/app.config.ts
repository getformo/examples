import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { FormoAnalyticsService } from './services/formo-analytics.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Initialize the Formo SDK before the app bootstraps, so its autocapture
    // has wrapped `window.ethereum` before any wallet interaction is possible.
    provideAppInitializer(() => inject(FormoAnalyticsService).init()),
  ],
};
