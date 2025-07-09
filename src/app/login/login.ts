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
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div
      class="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6 font-inter"
    >
      <style>
        /* Import Inter font for a modern look */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }

        /* Simple spinner animation for loading state */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #fff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
      </style>

      <form
        (ngSubmit)="login()"
        class="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-gray-700"
      >
        <h2 class="text-3xl font-bold text-center text-blue-400">Login</h2>
        <input
          [(ngModel)]="email"
          name="email"
          placeholder="Email"
          required
          class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          [(ngModel)]="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          [disabled]="loading"
          class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <span *ngIf="!loading">Login</span>
          <span *ngIf="loading" class="flex items-center">
            <div class="spinner mr-2"></div>
            Logging in...
          </span>
        </button>
        <div *ngIf="errorMessage" class="text-red-400 text-sm text-center p-2 bg-red-900 bg-opacity-30 rounded-md">
          {{ errorMessage }}
        </div>
      </form>

      <button
        (click)="goToSignup()"
        class="mt-6 text-blue-400 hover:text-blue-300 font-medium transition duration-200 ease-in-out transform hover:scale-105"
      >
        Create New Organization
      </button>
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
    let userDepartment: string | null = null; // Declare the variable here

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
          userDepartment = 'Root Admin'; // Assign a department for root if needed in dashboard
          break;
        }
      }

      // Step 2: If not a 'root' user, proceed to check the domain-nested structure
      if (!userFoundInFirestore) {
        let emailParts = this.email.split('@');
        let localPart = emailParts[0];
        let emailHost = emailParts[1];
        let userDomain = ''; // This will hold the extracted domain name

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
                userDepartment = userDomain; // Set userDepartment to the extracted domain name
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
                  userDepartment = userDomain; // Set userDepartment to the extracted domain name
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
          // If no specific domain department is found (e.g., for root user), clear it
          localStorage.removeItem('userDepartment');
      }

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Login failed:', err);
      // Provide user-friendly error messages
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