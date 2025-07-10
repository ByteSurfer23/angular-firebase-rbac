// src/app/sign-out-button/sign-out-button.component.ts

import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-out-button',
  standalone: true,
  imports: [CommonModule, NgIf],
  template: `
    <div class="flex justify-center items-center p-4">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }

        /* Card Entry Animation */
        @keyframes slide-in-fade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-fade {
            animation: slide-in-fade 0.6s ease-out forwards;
        }

        /* --- CUSTOM GRADIENT STYLES (Yellow & Hot Pink) --- */
        .bg-custom-gradient {
            background: linear-gradient(to right, #FFEA00, #FF1493); /* Bright Yellow to Hot Pink */
        }
      </style>

      <button
        (click)="signOut()"
        class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 shadow-md border-2 border-gray-300 animate-slide-in-fade"
      >
        Sign Out
      </button>
    </div>

    <!-- Optional: Error message display for sign-out issues -->
    <div *ngIf="errorMessage" class="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50">
      <span class="block sm:inline font-medium">{{ errorMessage }}</span>
      <button type="button" class="ml-4 text-red-600 hover:text-red-800" (click)="errorMessage = null">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
          <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
        </svg>
      </button>
    </div>
  `,
  styles: [] // All styles are inline in the template for a single-file component
})
export class SignOutButtonComponent {
  errorMessage: string | null = null;

  constructor(private auth: Auth, private router: Router) {}

  /**
   * Signs out the current user, clears local storage, and navigates to the login page.
   */
  async signOut(): Promise<void> {
    this.errorMessage = null; // Clear previous errors
    try {
      await signOut(this.auth);
      console.log('User signed out successfully.');

      // Clear all relevant items from local storage
      localStorage.clear(); // Clears all items, which is simpler for a complete sign-out

      // Navigate to the login page
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error signing out:', error);
      this.errorMessage = `Sign out failed: ${error.message || 'An unknown error occurred.'}`;
    }
  }
}
