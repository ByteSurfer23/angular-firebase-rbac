// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

// NEW: Import RECAPTCHA_SETTINGS and RecaptchaSettings for correct configuration
import { RECAPTCHA_SETTINGS, RecaptchaSettings, RecaptchaModule } from 'ng-recaptcha';
import { provideHttpClient } from '@angular/common/http';


// standalone component :
/* It's a component that can work on its own, importing its dependencies directly, making your code simpler and more modular. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Firebase app and services are now directly in the providers array
    provideFirebaseApp(() => initializeApp({ projectId: "to-do-list-7259e", appId: "1:862659189621:web:9c93ad9d67870eb773113c", storageBucket: "to-do-list-7259e.firebasestorage.app", apiKey: "AIzaSyC1pwzlbRu0hDN8_i33mBqqURGO-tDXjoc", authDomain: "to-do-list-7259e.firebaseapp.com", messagingSenderId: "862659189621", measurementId: "G-10JS85S8EQ" })),
    provideAuth(() => getAuth()),
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    ScreenTrackingService,
    UserTrackingService,
    // RecaptchaModule is still imported via importProvidersFrom as it's a traditional NgModule
    importProvidersFrom(
      RecaptchaModule
    ),
    // Provide RECAPTCHA_SETTINGS using the injection token
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: "6LcT33QrAAAAADYtebRWsQqSo9YA-W9uB3d8ekXA", // Your PUBLIC Site Key
      } as RecaptchaSettings,
    }
  ]
};
