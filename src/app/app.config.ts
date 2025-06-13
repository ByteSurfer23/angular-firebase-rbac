import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "to-do-list-7259e", appId: "1:862659189621:web:9c93ad9d67870eb773113c", storageBucket: "to-do-list-7259e.firebasestorage.app", apiKey: "AIzaSyC1pwzlbRu0hDN8_i33mBqqURGO-tDXjoc", authDomain: "to-do-list-7259e.firebaseapp.com", messagingSenderId: "862659189621", measurementId: "G-10JS85S8EQ" })), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase())
  ]
};
