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
import { CommonModule } from '@angular/common'; // Added for *ngIf directive

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // Ensure CommonModule is imported for *ngIf
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
  errorMessage: string | null = null; // For displaying login errors
  loading: boolean = false; // Added for loading state

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async login() {
    this.loading = true; // Set loading to true on login attempt
    let role = '';
    let customization: any = null; // Can be an object or null
    let orgId = '';
    let userFoundInFirestore = false; // Flag to indicate if user data is found in Firestore
    let domainid = '';
    let useremail: string | null = '';
    this.errorMessage = null; // Clear any previous error messages
    try {
      const userCred = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      console.log('Firebase Auth User:', userCred.user);
      const uid = userCred.user.uid;
      useremail = this.email;
      // Step 1: Try to find the user as a 'root' admin (UNTOUCHED)
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
          break; // Root user found, no need to check further
        }
      }

      // Step 2: If not a 'root' user, proceed to check the domain-nested structure
      // (Admin or Regular User within a Domain)
      if (!userFoundInFirestore) {
        // --- MODIFIED DOMAIN EXTRACTION LOGIC ---
        let emailParts = this.email.split('@');
        let localPart = emailParts[0]; // e.g., "xyz.yourdomainname"
        let emailHost = emailParts[1]; // e.g., "gmail.com"
        let userDomain = '';

        // List of common public email providers. Add more as needed.
        const commonProviders = [
          'gmail.com',
          'outlook.com',
          'yahoo.com',
          'hotmail.com',
          'aol.com',
          'protonmail.com',
        ];

        if (commonProviders.includes(emailHost)) {
          // If it's a common provider, we look for the "yourdomainname" inside the local part
          const localNameParts = localPart.split('.'); // e.g., ["xyz", "yourdomainname"]
          if (localNameParts.length >= 2) {
            // If the format is 'something.yourdomainname@provider.com',
            // 'yourdomainname' is the last segment of the local part.
            userDomain = localNameParts[localNameParts.length - 1];
          } else {
            // If no dot in local part (e.g., "username@gmail.com"), it doesn't fit the custom domain pattern.
            userDomain = '';
          }
        } else {
          // If it's not a common provider (e.g., user@yourcompany.com), the host itself is the domain.
          userDomain = emailHost;
        }
        // --- END MODIFIED DOMAIN EXTRACTION LOGIC ---

        if (userDomain) {
          // Only proceed if a userDomain was successfully extracted
          for (const orgDoc of orgsSnap.docs) {
            // If a user was found in a previous orgDoc iteration as admin/user, stop searching
            if (userFoundInFirestore) break;

            orgId = orgDoc.id; // Set current organization ID
            const orgData = orgDoc.data();
            // Retrieve the 'domains' map from the organization document
            const domainsMap: { [key: string]: string } =
              orgData?.['domains'] || {};

            // Find the domain UID associated with the extracted userDomain name
            const domainUid = domainsMap[userDomain];

            if (domainUid) {
              // Check for user in the 'admins' subcollection of this specific domain
              domainid = domainUid;
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
                break; // Admin found for this domain, stop searching
              }

              // If not found as an admin, check for user in the 'users' subcollection of this specific domain
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
                  break; // Regular user found for this domain, stop searching
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
      localStorage.setItem('useremail', useremail);

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
        this.errorMessage = err.message; // Display specific error from custom throws
      } else {
        this.errorMessage = 'Login failed. Please try again.';
      }
    } finally {
      this.loading = false; // Always set loading to false after attempt
    }
  }

  goToSignup() {
    this.router.navigate(['/root-signup']);
  }
}
