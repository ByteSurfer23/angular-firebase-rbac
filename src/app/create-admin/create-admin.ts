// src/app/create-admin/create-admin.ts

import { Component, Input, OnInit } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { CommonModule, NgIf } from '@angular/common'; // Import NgIf for conditional rendering
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Ensure this path is correct

@Component({
  selector: 'app-create-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf], // Add NgIf to imports
  template: `
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
      }
    </style>

    <form
      (ngSubmit)="createAdmin()"
      class="min-h-screen flex flex-col items-center justify-center
             bg-gray-50 p-6 text-gray-800 font-poppins
             bg-white rounded-lg shadow-xl w-full max-w-2xl border-2 border-gray-300 space-y-8 animate-slide-in-fade"
    >
      <h3 class="text-3xl font-bold text-center text-custom-gradient mb-6">
        Create Admin
      </h3>

      <div
        *ngIf="message"
        [ngClass]="{
          'bg-green-100 border-green-300 text-green-800': isSuccessMessage,
          'bg-red-100 border-red-300 text-red-800': !isSuccessMessage
        }"
        class="p-3 rounded-md relative mb-4 flex items-center justify-between w-full"
        role="alert"
      >
        <span class="block sm:inline">{{ message }}</span>
        <button
          type="button"
          class="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          (click)="message = ''; isSuccessMessage = false"
        >
          <svg
            class="fill-current h-5 w-5"
            role="button"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z"
            />
          </svg>
        </button>
      </div>

      <div class="w-full">
        <label for="adminName" class="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
        <input
          [(ngModel)]="name"
          name="name"
          id="adminName"
          placeholder="Enter admin name"
          required
          class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                 input-focus-glow transition duration-250 ease-in-out"
        />
      </div>

      <div class="w-full">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          [(ngModel)]="email"
          name="email"
          id="email"
          placeholder="Enter admin email"
          required
          class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                 input-focus-glow transition duration-250 ease-in-out"
        />
      </div>

      <div class="w-full">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          [(ngModel)]="password"
          name="password"
          id="password"
          type="password"
          placeholder="Enter password"
          required
          class="w-full p-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                 input-focus-glow transition duration-250 ease-in-out"
        />
      </div>

      <div class="space-y-3 text-gray-700 w-full">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            [(ngModel)]="userAnalytics"
            name="userAnalytics"
            class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span>Enable User Analytics</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            [(ngModel)]="orgAnalytics"
            name="orgAnalytics"
            class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span>Enable Org Analytics</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" [(ngModel)]="auditLog" name="auditLog"
                 class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
          <span>Enable Audit Log</span>
        </label>
      </div>

      <div class="space-y-3 w-full">
        <label class="block text-gray-700 font-medium mb-1">Assign to Domains:</label>
        <div *ngIf="domains.length === 0" class="text-sm text-gray-500 p-2 border border-gray-200 rounded-md bg-gray-50">
          No domains found for this organization.
        </div>

        <div *ngFor="let domain of domains" class="flex items-center space-x-2 p-2 bg-gray-50 rounded-md border border-gray-200">
          <input
            type="checkbox"
            #domainCheckbox
            [checked]="domain.selected"
            (change)="onDomainSelectionChange(domain.uid, domainCheckbox.checked)"
            class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span class="text-gray-700">{{ domain.name }}</span>
        </div>
      </div>

      <button
        type="submit"
        [disabled]="loading"
        class="w-full py-3 px-6 text-white font-semibold rounded-md bg-custom-gradient border-2 border-gray-300
               hover:bg-custom-gradient active:bg-custom-gradient
               transition duration-1000 ease-in-out transform hover:-translate-y-0.5
               disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span *ngIf="!loading">Create Admin</span>
        <span *ngIf="loading" class="flex items-center space-x-2">
          <div class="loader-spinner"></div>
          <span>Creating...</span>
        </span>
      </button>
    </form>
  `,
})
export class CreateAdminComponent implements OnInit {
  @Input() orgId!: string | null;
  name = '';
  email = '';
  password = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;
  message = '';
  isSuccessMessage: boolean = false; // To control message styling
  loading: boolean = false; // Loading state for the button

  domains: { name: string; uid: string; selected: boolean }[] = [];
  selectedDomainUids: string[] = [];

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit(): void {
    this.fetchDomains();
  }

  async fetchDomains() {
    if (!this.orgId) {
      console.warn('orgId is not provided for fetching domains.');
      this.showTemporaryMessage(
        'Organization ID is missing. Cannot fetch domains.',
        false
      );
      return;
    }
    try {
      const orgDocRef = doc(this.firestore, `organizations/${this.orgId}`);
      const orgDocSnap = await getDoc(orgDocRef);

      if (orgDocSnap.exists()) {
        const orgData = orgDocSnap.data();
        const domainsMap: { [key: string]: string } = orgData?.['domains'] || {};

        this.domains = Object.entries(domainsMap).map(([name, uid]) => ({
          name: name,
          uid: uid,
          selected: false,
        }));
      } else {
        this.showTemporaryMessage('Organization not found to fetch domains.', false);
        this.domains = [];
      }
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      this.showTemporaryMessage(`Failed to fetch domains: ${error.message}`, false);
    }
  }

  onDomainSelectionChange(domainUid: string, isChecked: boolean) {
    if (isChecked) {
      if (!this.selectedDomainUids.includes(domainUid)) {
        this.selectedDomainUids.push(domainUid);
      }
    } else {
      this.selectedDomainUids = this.selectedDomainUids.filter(
        (uid) => uid !== domainUid
      );
    }
    console.log('Selected Domain UIDs:', this.selectedDomainUids);
  }

  async createAdmin() {
    if (!this.orgId) {
      this.showTemporaryMessage(
        'Organization ID is missing. Cannot create admin.',
        false
      );
      return;
    }
    if (this.selectedDomainUids.length === 0) {
      this.showTemporaryMessage(
        'Please select at least one domain for the admin.',
        false
      );
      return;
    }

    this.loading = true; // Start loading
    this.message = ''; // Clear previous messages
    this.isSuccessMessage = false;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const newAdminUid = userCredential.user.uid;

      for (const domainUid of this.selectedDomainUids) {
        const adminRef = doc(
          this.firestore,
          `organizations/${this.orgId}/domain/${domainUid}/admins/${newAdminUid}`
        );

        await setDoc(adminRef, {
          uid: newAdminUid,
          orgId: this.orgId,
          name: this.name,
          email: this.email,
          role: 'admin',
          createdAt: new Date(),
          isActive: true,
          customization: {
            userAnalytics: this.userAnalytics,
            orgAnalytics: this.orgAnalytics,
            auditLog: this.auditLog,
          },
          associatedDomains: this.selectedDomainUids,
        });

        const domainDocRef = doc(
          this.firestore,
          `organizations/${this.orgId}/domain/${domainUid}`
        );
        await updateDoc(domainDocRef, {
          adminUids: arrayUnion(newAdminUid),
        }).catch((domainUpdateError) => {
          console.error(
            `Error updating domain ${domainUid} with admin UID:`,
            domainUpdateError
          );
        });
      }

      const actoruid = localStorage.getItem('uid');
      logAuditActionWithSetDoc(
        this.firestore,
        actoruid || 'unknown',
        'admin_creation',
        newAdminUid,
        'success'
      );

      this.showTemporaryMessage('Admin created successfully!', true);
      this.name = '';
      this.email = '';
      this.password = '';
      this.userAnalytics = false;
      this.orgAnalytics = false;
      this.auditLog = false;
      this.selectedDomainUids = [];
      this.domains.forEach((d) => (d.selected = false)); // Reset checkboxes
    } catch (error: any) {
      console.error('Error creating admin:', error);
      let errorMessage = 'Failed to create admin. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'The email address is already in use by another account.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.showTemporaryMessage(errorMessage, false);
    } finally {
      this.loading = false; // End loading
    }
  }

  showTemporaryMessage(msg: string, isSuccess: boolean) {
    this.message = msg;
    this.isSuccessMessage = isSuccess;
    setTimeout(() => {
      this.message = '';
      this.isSuccessMessage = false;
    }, 5000);
  }
}
