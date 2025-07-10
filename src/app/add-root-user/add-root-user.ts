// src/app/add-root-user/add-root-user.component.ts
import { Component } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { CommonModule, NgIf } from '@angular/common'; // Import CommonModule and NgIf

@Component({
  selector: 'app-add-root-user',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf], // Add CommonModule and NgIf to imports
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-800 font-poppins">
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

        /* Pulsing dot animation (not directly used here, but for consistency) */
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
        (ngSubmit)="addRootUser()"
        class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-2 border-gray-300 space-y-8 animate-slide-in-fade"
      >
        <h2 class="text-3xl font-bold text-center text-custom-gradient">Create Organization & Root User</h2>
        
        <!-- Input Fields -->
        <div class="space-y-5">
          <div>
            <label for="orgName" class="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
            <input [(ngModel)]="orgName" name="orgName" id="orgName" placeholder="Enter organization name" required
              class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                     input-focus-glow transition duration-250 ease-in-out" />
          </div>
          <div>
            <label for="rootName" class="block text-sm font-medium text-gray-700 mb-2">Root User Name</label>
            <input [(ngModel)]="rootName" name="rootName" id="rootName" placeholder="Enter root user name" required
              class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                     input-focus-glow transition duration-250 ease-in-out" />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">User Email</label>
            <input [(ngModel)]="email" name="email" id="email" placeholder="Enter user email" required
              class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                     input-focus-glow transition duration-250 ease-in-out" />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input [(ngModel)]="password" name="password" id="password" type="password" placeholder="Enter password" required
              class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                     input-focus-glow transition duration-250 ease-in-out" />
          </div>
        </div>

        <!-- Customization Checkboxes -->
        <div class="flex flex-col space-y-3 text-gray-700">
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="customization.userAnalytics" name="userAnalytics"
                       class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                <span>Enable User Analytics</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="customization.orgAnalytics" name="orgAnalytics"
                       class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                <span>Enable Org Analytics</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="customization.auditLog" name="auditLog"
                       class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                <span>Enable Audit Log</span>
            </label>
        </div>

        <button
          type="submit"
          [disabled]="loading"
          class="w-full py-3 px-6 text-white font-semibold rounded-md bg-custom-gradient border-2 border-gray-300
                 hover:bg-custom-gradient active:bg-custom-gradient
                 transition duration-1000 ease-in-out transform hover:-translate-y-0.5
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <span *ngIf="!loading">Create Organization & Root User</span>
          <span *ngIf="loading" class="flex items-center space-x-2">
            <div class="loader-spinner"></div>
            <span>Creating...</span>
          </span>
        </button>

        <div *ngIf="errorMessage" class="text-red-800 text-sm text-center p-3 bg-red-100 border border-red-300 rounded-md">
          {{ errorMessage }}
        </div>
        <div *ngIf="successMessage" class="text-green-800 text-sm text-center p-3 bg-green-100 border border-green-300 rounded-md">
          {{ successMessage }}
        </div>
      </form>
    </div>
  `,
})
export class AddRootUserComponent {
  orgName = '';
  rootName = '';
  email = '';
  password = '';
  customization = {
    userAnalytics: false,
    orgAnalytics: false,
    auditLog: false
  };
  loading: boolean = false; // Add loading state
  errorMessage: string | null = null; // For displaying errors
  successMessage: string | null = null; // For displaying success messages

  constructor(private firestore: Firestore, private router: Router, private auth: Auth) {}

  async addRootUser() {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const orgId = uuidv4();

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      const uid = userCredential.user.uid;

      const orgRef = doc(this.firestore, `organizations/${orgId}`);
      await setDoc(orgRef, {
        orgId,
        name: this.orgName,
        createdAt: new Date(),
        createdBy: uid,
        active: true
      });

      const userRef = doc(this.firestore, `organizations/${orgId}/root/${uid}`);
      await setDoc(userRef, {
        uid,
        orgId,
        name: this.rootName,
        email: this.email,
        role: 'root',
        createdAt: new Date(),
        isActive: true,
        customization: this.customization,
      });

      this.successMessage = 'Organization and root user created successfully!';
      // Optionally navigate after a short delay to allow user to read success message
      setTimeout(() => {
        this.router.navigate(['']); // Navigate to login or dashboard
      }, 2000);

    } catch (err: any) {
      console.error('Error creating organization/root user:', err);
      // More specific error handling
      if (err.code === 'auth/email-already-in-use') {
        this.errorMessage = 'The email address is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        this.errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.message) {
        this.errorMessage = err.message;
      } else {
        this.errorMessage = 'Failed to create organization/root user. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }
}
