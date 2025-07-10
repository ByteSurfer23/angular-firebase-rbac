// src/app/login/login.component.ts

import { Component } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  getDocs,
  collection,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common'; // Ensure NgIf is imported for *ngIf

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf], // Ensure NgIf is in imports
  template: `
       <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-gray-800 font-poppins">
      <style>
        /* Google Font: Poppins */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }

        /* Custom Spinner Animation for Light Background */
        @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loader-spinner {
            border: 2px solid rgba(0, 0, 0, 0.2);
            border-top: 2px solid #2563eb; /* Blue accent for spinner */
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin-loader 1s linear infinite;
        }

        /* Subtle glow for focus */
        .input-focus-glow:focus {
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5);
            outline: none;
        }

        /* Card Entry Animation */
        @keyframes slide-in-fade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-fade {
            animation: slide-in-fade 0.6s ease-out forwards;
        }

        /* Pulsing dot animation (for the 'Create New Organization' link) */
        @keyframes pulse-dot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        .animate-pulse-dot {
            animation: pulse-dot 1s infinite;
        }

        /* --- CUSTOM GRADIENT STYLES (Yellow & Hot Pink) --- */
        .text-custom-gradient {
            background: linear-gradient(to right, #FFEA00, #FF1493); /* Bright Yellow to Hot Pink */
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
            display: inline-block;
        }

        .bg-custom-gradient {
            background: linear-gradient(to right, #FFEA00, #FF1493); /* Bright Yellow to Hot Pink */
            /* Transition for transform is now handled by Tailwind classes directly on the element */
        }
      </style>

      <form
        (ngSubmit)="login()"
        class="pt-4 pb-8 px-8 rounded-lg shadow-xl w-full max-w-md border-2 border-gray-300 space-y-5 animate-slide-in-fade"
      >
        <h2 class="text-3xl font-bold text-center text-custom-gradient py-4">Login</h2> <!-- Adjusted margin for higher position -->
        
        <!-- Input Fields -->
        <div class="space-y-5">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                    [(ngModel)]="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    required
                    class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                           input-focus-glow transition duration-250 ease-in-out"
                />
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                    [(ngModel)]="password"
                    name="password"
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                           input-focus-glow transition duration-250 ease-in-out"
                />
            </div>
        </div>

        <button
          type="submit"
          [disabled]="loading"
          class="w-full py-3 px-6 text-white font-semibold rounded-md bg-custom-gradient border-2 border-gray-300
                 hover:bg-custom-gradient active:bg-custom-gradient
                 transition duration-100 ease-in-out transform hover:-translate-y-0.5
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <span *ngIf="!loading">Login</span>
          <span *ngIf="loading" class="flex items-center space-x-2">
            <div class="loader-spinner"></div>
            <span>Logging in...</span>
          </span>
        </button>
        
        <div *ngIf="errorMessage" class="text-red-800 text-sm text-center p-3 bg-red-100 border border-red-300 rounded-md">
          {{ errorMessage }}
        </div>

        <!-- Moved "Create New Organization" button inside the form, styled grey -->
<button
  (click)="goToSignup()"
  type="button" 
  class="mt-4 w-full text-gray-300 py-3 rounded-md 
         font-medium transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center space-x-2"
>
  <span class="text-gray-400">Create New Organization</span>
</button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  loading: boolean = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async login() {
    this.loading = true;
    let role = '';
    let customization: any = null;
    let orgId = '';
    let userFoundInFirestore = false;
    let domainid = '';
    let useremail: string | null = '';
    let userDepartment: string | null = null;

    this.errorMessage = null;

    try {
      const userCred = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      console.log('Firebase Auth User:', userCred.user);
      const uid = userCred.user.uid;
      useremail = this.email;

      // Step 1: Try to find the user as a 'root' admin
      const orgsSnap = await getDocs(
        collection(this.firestore, 'organizations')
      );

      for (const orgDoc of orgsSnap.docs) {
        const rootAdminRef = doc(
          this.firestore,
          `organizations/${orgDoc.id}/root/${uid}`
        );
        const rootAdminSnap = await getDoc(rootAdminRef);

        if (
          rootAdminSnap.exists() &&
          rootAdminSnap.data()?.['role'] === 'root'
        ) {
          role = 'root';
          customization = rootAdminSnap.data()?.['customization'] || {};
          orgId = orgDoc.id;
          userFoundInFirestore = true;
          userDepartment = 'Root Admin';
          break;
        }
      }

      // Step 2: If not a 'root' user, proceed to check the domain-nested structure
      if (!userFoundInFirestore) {
        let emailParts = this.email.split('@');
        let localPart = emailParts[0];
        let emailHost = emailParts[1];
        let userDomain = '';

        const commonProviders = [
          'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
          'aol.com', 'protonmail.com',
        ];

        if (commonProviders.includes(emailHost)) {
          const localNameParts = localPart.split('.');
          if (localNameParts.length >= 2) {
            userDomain = localNameParts[localNameParts.length - 1];
          } else {
            userDomain = '';
          }
        } else {
          userDomain = emailHost;
        }

        if (userDomain) {
          for (const orgDoc of orgsSnap.docs) {
            if (userFoundInFirestore) break;

            orgId = orgDoc.id;
            const orgData = orgDoc.data();
            const domainsMap: { [key: string]: string } =
              orgData?.['domains'] || {};

            const domainUid = domainsMap[userDomain];

            if (domainUid) {
              domainid = domainUid;

              // Check for admin role within this domain
              const adminRef = doc(
                this.firestore,
                `organizations/${orgId}/domain/${domainUid}/admins/${uid}`
              );
              const adminSnap = await getDoc(adminRef);

              if (
                adminSnap.exists() &&
                adminSnap.data()?.['role'] === 'admin'
              ) {
                role = 'admin';
                customization = adminSnap.data()?.['customization'] || {};
                userFoundInFirestore = true;
                userDepartment = userDomain;
                break;
              }

              // If not found as an admin, check for user role within this domain
              if (!userFoundInFirestore) {
                const userRef = doc(
                  this.firestore,
                  `organizations/${orgId}/domain/${domainUid}/users/${uid}`
                );
                const userSnap = await getDoc(userRef);

                if (userSnap.exists() && userSnap.data()?.['role'] === 'user') {
                  role = 'user';
                  customization = userSnap.data()?.['customization'] || {};
                  userFoundInFirestore = true;
                  userDepartment = userDomain;
                  break;
                }
              }
            }
          }
        }
      }

      if (!userFoundInFirestore) {
        throw new Error(
          'User profile not found or not authorized for any organization/domain.'
        );
      }

      // Store user information in local storage
      localStorage.setItem('userRole', role);
      localStorage.setItem('customization', JSON.stringify(customization));
      localStorage.setItem('orgId', orgId);
      localStorage.setItem('uid', uid);
      localStorage.setItem('domainUid', domainid);
      localStorage.setItem('useremail', useremail || '');

      // Store userDepartment in localStorage
      if (userDepartment) {
          localStorage.setItem('userDepartment', userDepartment);
      } else {
          localStorage.removeItem('userDepartment');
      }

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Login failed:', err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        this.errorMessage = 'Invalid email or password.';
      } else if (err.message) {
        this.errorMessage = err.message;
      } else {
        this.errorMessage = 'Login failed. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }

  goToSignup() {
    this.router.navigate(['/root-signup']);
  }
}
