import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  Timestamp
} from '@angular/fire/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  updatePassword,
} from '@angular/fire/auth';
import { initializeApp } from '@angular/fire/app';

// --- Interfaces ---

interface DomainAsset {
  key: string;
  url: string;
}

interface UserProjectAssignment {
  projectId: string;
  taskIds: string[];
}

interface UserFileAccess {
  assetKey: string;
  hasAccess: boolean;
}

interface UserCustomization {
  auditLog: boolean;
  orgAnalytics: boolean;
  userAnalytics: boolean;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: 'user';
  orgId: string;
  domainUid: string;
  projectAssignments: UserProjectAssignment[]; // Re-added for completeness, though not in form
  fileAccesses: UserFileAccess[];
  customization: UserCustomization;
  createdAt: Timestamp;
  createdByUid: string;
}

// --- End Interfaces ---

// Placeholder for logAuditActionWithSetDoc - for demonstration purposes.
const logAuditActionWithSetDoc = (firestoreInstance: Firestore, actorUid: string, action: string, resourceUid: string, status: string) => {
  console.log(`AUDIT LOG: User ${actorUid} performed ${action} on ${resourceUid} with status ${status}`);
  // Example: addDoc(collection(firestoreInstance, 'auditLogs'), { actorUid, action, resourceUid, status, timestamp: Timestamp.now() });
};

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
   <div class="min-h-screen text-gray-800 font-poppins p-4 sm:p-6 rounded-xl overflow-hidden">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
    body { font-family: 'Poppins', sans-serif; }

    /* Custom Scrollbar for light theme */
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #e5e7eb; /* gray-200 */
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #9ca3af; /* gray-400 */
        border-radius: 4px;
        border: 2px solid #e5e7eb; /* gray-200 */
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #6b7280; /* gray-500 */
    }

    /* Subtle glow for focus */
    .input-focus-glow:focus {
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5); /* Blue glow */
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

  <header class="bg-white p-6 rounded-xl shadow-lg mb-6 text-center border-2 border-gray-300 animate-slide-in-fade">
    <h1 class="text-3xl font-extrabold text-custom-gradient flex items-center justify-center">
      Domain User Management
    </h1>
    <p class="text-lg text-gray-600 mt-3">
      Organization: <strong class="font-semibold text-blue-600">{{ orgId || 'N/A' }}</strong> |
      Domain: <strong class="font-semibold text-pink-600">{{ domainUid || 'N/A' }}</strong>
    </p>
  </header>

  <!-- Messages -->
  <div *ngIf="message" class="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-4 shadow-md">
    <span class="block sm:inline font-medium">{{ message }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-green-600 hover:text-green-800" (click)="message = ''">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
      </svg>
    </button>
  </div>
  <div *ngIf="errorMessage" class="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-4 shadow-md">
    <span class="block sm:inline font-medium">{{ errorMessage }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-red-600 hover:text-red-800" (click)="errorMessage = ''">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
      </svg>
    </button>
  </div>

  <main class="flex flex-col lg:flex-row gap-6">
    <!-- Create/Edit User Form -->
    <section class="lg:w-1/2 animate-slide-in-fade">
      <h2 class="text-2xl font-bold text-custom-gradient mb-4 flex items-center">
        {{ editingUser ? 'Edit User' : 'Create New User' }}
      </h2>
      <form (ngSubmit)="handleCreateOrUpdateUser()" class="space-y-4">
        <input
          type="text"
          placeholder="User Name"
          [(ngModel)]="userName"
          name="userName"
          required
          class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
        />
        <input
          type="email"
          placeholder="User Email"
          [(ngModel)]="userEmail"
          name="userEmail"
          required
          class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
        />
        <input
          type="password"
          [placeholder]="editingUser ? 'New Password (optional)' : 'Password'"
          [(ngModel)]="userPassword"
          name="userPassword"
          [required]="!editingUser"
          class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
        />
        <input
          type="password"
          [placeholder]="editingUser ? 'Confirm New Password' : 'Confirm Password'"
          [(ngModel)]="userConfirmPassword"
          name="userConfirmPassword"
          [required]="!editingUser"
          class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
        />

        <!-- Customization Permissions -->
        <div class="border-2 border-gray-300 p-4 rounded-lg space-y-2 bg-white shadow-sm">
          <h3 class="text-lg font-semibold text-blue-600">User Permissions (Subset of Admin's)</h3>
          <label class="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              [(ngModel)]="userAuditLog"
              name="userAuditLog"
              [disabled]="!adminCustomization.auditLog"
              class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Access Audit Log</span>
          </label>
          <label class="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              [(ngModel)]="userOrgAnalytics"
              name="userOrgAnalytics"
              [disabled]="!adminCustomization.orgAnalytics"
              class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Access Org Analytics</span>
          </label>
          <label class="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              [(ngModel)]="userUserAnalytics"
              name="userUserAnalytics"
              [disabled]="!adminCustomization.userAnalytics"
              class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Access User Analytics</span>
          </label>
        </div>

        <!-- File Accesses -->
        <div class="border-2 border-gray-300 p-4 rounded-lg space-y-2 bg-white shadow-sm">
          <h3 class="text-lg font-semibold text-blue-600">File Accesses</h3>
          <ng-container *ngIf="domainAssets.length === 0; else assetsList">
            <p class="text-gray-500 text-sm">No domain assets found to grant access.</p>
          </ng-container>
          <ng-template #assetsList>
            <label *ngFor="let asset of domainAssets; let i = index" class="flex items-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                [checked]="isFileAccessChecked(asset.key)"
                (change)="handleFileAccessChange(asset.key, $event)"
                class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>{{ asset.key }} (<a [href]="asset.url" target="_blank" class="text-blue-600 hover:underline text-sm break-all">{{ asset.url }}</a>)</span>
            </label>
          </ng-template>
        </div>

        <div class="flex gap-4 pt-2">
          <button type="submit"
                  class="flex-grow bg-custom-gradient text-white font-bold py-3 px-6 rounded-lg border-2 border-gray-300
                         hover:opacity-90 active:opacity-100 transition duration-300 ease-in-out transform hover:-translate-y-0.5">
            {{ editingUser ? 'Update User' : 'Create User' }}
          </button>
          <button *ngIf="editingUser" type="button" (click)="resetForm()"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-300 transition duration-200 ease-in-out transform hover:scale-105">
            Cancel Edit
          </button>
        </div>
      </form>
    </section>

    <!-- User List & Search -->
    <section class="lg:w-1/2  p-6 animate-slide-in-fade">
      <h2 class="text-2xl font-bold text-custom-gradient mb-4 flex items-center">
        Search Users
      </h2>
      <div class="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          [(ngModel)]="searchTerm"
          name="searchTerm"
          class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
        />
      </div>
      <div class="overflow-x-auto rounded-lg border-2 border-gray-300 shadow-md custom-scrollbar">
        <table class="min-w-full bg-white rounded-lg overflow-hidden">
          <thead>
            <tr class="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
              <th class="py-3 px-6 text-left">Name</th>
              <th class="py-3 px-6 text-left">Email</th>
              <th class="py-3 px-6 text-center">Role</th>
              <th class="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-800 text-sm font-light">
            <tr *ngFor="let user of filteredUsers" class="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out">
              <td class="py-3 px-6 text-left whitespace-nowrap">{{ user.name }}</td>
              <td class="py-3 px-6 text-left">{{ user.email }}</td>
              <td class="py-3 px-6 text-center">{{ user.role | titlecase }}</td>
              <td class="py-3 px-6 text-center">
                <div class="flex item-center justify-center space-x-2">
                  <button (click)="handleEditUser(user)" class="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                  </button>
                  <button (click)="confirmDeleteUser(user)" class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredUsers.length === 0">
              <td colspan="4" class="py-4 text-center text-gray-500">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <!-- Custom Confirmation Modal -->
  <div *ngIf="showConfirmModal" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-slide-in-fade">
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center space-y-4 border-2 border-gray-300">
      <p class="text-lg text-gray-800 font-medium">{{ confirmModalMessage }}</p>
      <div class="flex justify-center space-x-4">
        <button
          (click)="confirmModalAction && confirmModalAction()"
          class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          Confirm
        </button>
        <button
          (click)="showConfirmModal = false"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>

  `,
})
export class UserManagementComponent implements OnInit, OnDestroy {
  // Firebase instances (injected by AngularFire)
  db: Firestore | null = null;
  auth: Auth | null = null;
  isAuthReady: boolean = false; // Indicates if Firebase services are initialized and admin info is loaded

  // Props (now derived from localStorage)
  orgId: string = '';
  domainUid: string = '';

  // Form States for New/Edit User
  userName: string = '';
  userEmail: string = '';
  userPassword: string = '';
  userConfirmPassword: string = '';

  // Re-added customization and file access states
  userAuditLog: boolean = false;
  userOrgAnalytics: boolean = false;
  userUserAnalytics: boolean = false;

  domainAssets: DomainAsset[] = [];
  userFileAccesses: UserFileAccess[] = [];

  // Re-added for completeness, though not in form
  userProjectAssignments: UserProjectAssignment[] = [];

  // Component States
  message: string = '';
  errorMessage: string = '';
  users: AppUser[] = [];
  searchTerm: string = '';
  editingUser: AppUser | null = null;

  adminCustomization: UserCustomization = {
    auditLog: false,
    orgAnalytics: false,
    userAnalytics: false,
  };
  currentAdminUid: string = '';
  currentAdminEmail: string = '';

  // Custom Confirmation Modal State
  showConfirmModal: boolean = false;
  confirmModalMessage: string = '';
  confirmModalAction: (() => void) | null = null;

  constructor(private firestore: Firestore, private angularAuth: Auth) {
    // Injected Firestore and Auth instances will be assigned to this.db and this.auth in initializeFirebaseAndAdminInfo
  }

  ngOnInit(): void {
    // Retrieve orgId and domainUid from localStorage
    this.orgId = localStorage.getItem('orgId') || '';
    this.domainUid = localStorage.getItem('domainUid') || '';

    // Initialize Firebase and set up admin info
    this.initializeFirebaseAndAdminInfo();
  }

  ngOnDestroy(): void {
    // No explicit subscriptions to unsubscribe from in this simplified version.
    // If you add any new RxJS subscriptions, remember to unsubscribe here.
  }

  private initializeFirebaseAndAdminInfo(): void {
    try {
      // Access global variables for Canvas environment
      const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';
      const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined' ? JSON.parse((window as any).__firebase_config) : {};

      // Initialize Firebase App if it hasn't been already (AngularFire usually handles this)
      try {
        initializeApp(firebaseConfig, appId);
      } catch (e: any) {
        if (e.code === 'app/duplicate-app') {
          // App already initialized, safely ignore
        } else {
          console.error("Error initializing Firebase app:", e);
          throw e;
        }
      }

      this.db = this.firestore; // Assign injected Firestore instance
      this.auth = this.angularAuth; // Assign injected Auth instance

      // Directly get admin UID and email from localStorage, assuming they are set by a prior login
      this.currentAdminUid = localStorage.getItem('uid') || '';
      this.currentAdminEmail = localStorage.getItem('useremail') || 'admin@example.com';

      if (!this.currentAdminUid) {
        this.showTemporaryMessage("Admin UID not found in localStorage. Please ensure admin is logged in.", true);
      }
      if (!this.currentAdminEmail) {
        this.showTemporaryMessage("Admin email not found in localStorage.", true);
      }

      this.isAuthReady = true; // Mark auth as ready since we assume a logged-in state
      
      // Fetch data and users immediately as auth is assumed ready
      if (this.orgId && this.domainUid && this.db && this.auth && this.currentAdminUid) {
        this.fetchAdminDataAndDomainAssets(); // Now fetching admin customization and domain assets
        this.fetchUsers();
      } else if (!this.orgId || !this.domainUid) {
        this.showTemporaryMessage('Organization ID or Domain ID not found in localStorage. Cannot load data.', true);
      } else if (!this.db || !this.auth) {
        this.showTemporaryMessage('Firebase services not initialized. Cannot load data.', true);
      } else if (!this.currentAdminUid) {
        this.showTemporaryMessage('Admin UID not available. Cannot load data.', true);
      }
    } catch (error) {
      console.error("Error initializing Firebase in component:", error);
      this.showTemporaryMessage("Failed to initialize Firebase. Please check console.", true);
    }
  }

  showTemporaryMessage(msg: string, isError: boolean = false): void {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => this.errorMessage = '', 5000);
    } else {
      this.message = msg;
      setTimeout(() => this.message = '', 5000);
    }
  }

  resetForm(): void {
    this.userName = '';
    this.userEmail = '';
    this.userPassword = '';
    this.userConfirmPassword = '';
    this.userAuditLog = false;
    this.userOrgAnalytics = false;
    this.userUserAnalytics = false;
    // Re-initialize userFileAccesses based on current domain assets
    this.userFileAccesses = this.domainAssets.map(asset => ({ assetKey: asset.key, hasAccess: false }));
    this.editingUser = null;
  }

  async fetchAdminDataAndDomainAssets(): Promise<void> {
    if (!this.db || !this.isAuthReady || !this.currentAdminUid || !this.orgId || !this.domainUid) {
      console.warn("Firebase not ready or required IDs missing for fetching admin data and domain assets.");
      return;
    }

    const storedAdminCustomization = localStorage.getItem('customization');

    if (storedAdminCustomization) {
      try {
        this.adminCustomization = JSON.parse(storedAdminCustomization);
      } catch (e) {
        console.error("Failed to parse admin customization from localStorage", e);
        this.showTemporaryMessage("Error parsing admin permissions from local storage.", true);
      }
    } else {
      // If customization is not in localStorage, try fetching from Firestore based on currentAdminUid
      if (this.db && this.currentAdminUid && this.orgId) {
        try {
          const adminDocRef = doc(this.db, `organizations/${this.orgId}/root/${this.currentAdminUid}`);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists() && adminDocSnap.data()?.['customization']) {
            this.adminCustomization = adminDocSnap.data()?.['customization'];
            localStorage.setItem('customization', JSON.stringify(this.adminCustomization));
          } else {
            console.warn("Admin customization not found in Firestore for current admin. Defaulting to no permissions.");
            this.adminCustomization = { auditLog: false, orgAnalytics: false, userAnalytics: false };
          }
        } catch (error) {
          console.error("Error fetching admin customization from Firestore:", error);
          this.showTemporaryMessage("Failed to fetch admin permissions from Firestore.", true);
        }
      }
    }

    // Fetch domain assets
    try {
      const domainDocRef = doc(this.db, `organizations/${this.orgId}/domain/${this.domainUid}`);
      const domainDocSnap = await getDoc(domainDocRef);

      if (domainDocSnap.exists()) {
        const domainData = domainDocSnap.data();
        const assets: DomainAsset[] = domainData?.['assets'] || [];
        this.domainAssets = assets;
        // Initialize userFileAccesses based on fetched domain assets
        this.userFileAccesses = assets.map(asset => ({ assetKey: asset.key, hasAccess: false }));
      } else {
        this.showTemporaryMessage("Domain not found. Cannot fetch assets.", true);
      }
    } catch (error) {
      console.error("Error fetching domain assets:", error);
      this.showTemporaryMessage("Failed to load domain assets.", true);
    }
  }

  // New helper function to determine if a file access checkbox should be checked
  isFileAccessChecked(assetKey: string): boolean {
    const foundAccess = this.userFileAccesses.find(fa => fa.assetKey === assetKey);
    return foundAccess ? foundAccess.hasAccess : false;
  }

  handleFileAccessChange(assetKey: string, event: Event): void {
    // Cast the event target to HTMLInputElement to access the 'checked' property
    const isChecked = (event.target as HTMLInputElement).checked;
    this.userFileAccesses = this.userFileAccesses.map(item =>
      item.assetKey === assetKey ? { ...item, hasAccess: isChecked } : item
    );
  }

  async fetchUsers(): Promise<void> {
    if (!this.db || !this.isAuthReady || !this.orgId || !this.domainUid) {
      this.users = [];
      return;
    }
    try {
      const usersCollectionRef = collection(this.db, `organizations/${this.orgId}/domain/${this.domainUid}/users`);
      const q = query(usersCollectionRef);
      const querySnapshot = await getDocs(q);
      this.users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data() as Omit<AppUser, 'uid'>
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      this.showTemporaryMessage("Failed to load users.", true);
    }
  }

  async handleCreateOrUpdateUser(): Promise<void> {
    if (!this.db || !this.auth || !this.orgId || !this.domainUid || !this.currentAdminUid) {
      this.showTemporaryMessage('Firebase services not ready or required IDs are missing.', true);
      return;
    }
    if (!this.userName || !this.userEmail) {
      this.showTemporaryMessage('Name and Email are required.', true);
      return;
    }

    if (!this.editingUser && (!this.userPassword || this.userPassword !== this.userConfirmPassword)) {
      this.showTemporaryMessage('Password and Confirm Password must match and not be empty for new users.', true);
      return;
    }

    try {
      let userUid = this.editingUser ? this.editingUser.uid : '';

      if (!this.editingUser) {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(this.auth, this.userEmail, this.userPassword);
        userUid = userCredential.user.uid;
      } else {
        // If updating an existing user and password fields are provided
        if (this.userPassword && this.userPassword === this.userConfirmPassword) {
          // IMPORTANT: Firebase client SDK cannot update another user's password directly.
          // This block is only for if the ADMIN is editing THEIR OWN password.
          // For other users, a Cloud Function or Admin SDK is required.
          if (this.auth.currentUser && this.auth.currentUser.uid === userUid) {
            await updatePassword(this.auth.currentUser, this.userPassword).catch(e => {
              console.warn("Could not update user's password directly (might need re-auth):", e);
              this.showTemporaryMessage("Password update might require re-authentication. User data updated.", false);
            });
          } else {
            this.showTemporaryMessage("Cannot update another user's password directly from client-side. Please use backend functionality (e.g., Cloud Functions).", true);
            // Do not proceed with password update if it's not the current user
          }
        }
      }

      const userDocRef = doc(this.db, `organizations/${this.orgId}/domain/${this.domainUid}/users/${userUid}`);

      const userData: AppUser = {
        uid: userUid,
        name: this.userName,
        email: this.userEmail,
        role: 'user',
        orgId: this.orgId,
        domainUid: this.domainUid,
        projectAssignments: [], // Assuming no project assignments in this simplified form
        fileAccesses: this.userFileAccesses,
        customization: {
          auditLog: this.userAuditLog,
          orgAnalytics: this.userOrgAnalytics,
          userAnalytics: this.userUserAnalytics,
        },
        createdAt: this.editingUser ? this.editingUser.createdAt : Timestamp.now(),
        createdByUid: this.editingUser ? this.editingUser.createdByUid : this.currentAdminUid,
      };

      await setDoc(userDocRef, userData, { merge: true });

      logAuditActionWithSetDoc(
        this.db,
        this.currentAdminUid,
        this.editingUser ? 'user_update' : 'user_creation',
        userUid,
        'success'
      );

      this.showTemporaryMessage(`User ${this.editingUser ? 'updated' : 'created'} successfully!`);
      this.resetForm();
      this.fetchUsers();
    } catch (error: any) {
      console.error("Error creating/updating user:", error);
      this.showTemporaryMessage(`Failed to ${this.editingUser ? 'update' : 'create'} user: ${error.message}`, true);
    }
  }

  confirmDeleteUser(userToDelete: AppUser): void {
    this.confirmModalMessage = `Are you sure you want to delete user ${userToDelete.email}? This action cannot be undone.`;
    this.confirmModalAction = () => this.handleDeleteUserConfirmed(userToDelete);
    this.showConfirmModal = true;
  }

  async handleDeleteUserConfirmed(userToDelete: AppUser): Promise<void> {
    if (!this.db || !this.currentAdminUid) {
      this.showTemporaryMessage('Firebase not initialized or admin UID missing.', true);
      this.showConfirmModal = false;
      return;
    }

    try {
      const userDocRef = doc(this.db, `organizations/${this.orgId}/domain/${this.domainUid}/users/${userToDelete.uid}`);
      await deleteDoc(userDocRef);

      logAuditActionWithSetDoc(
        this.db,
        this.currentAdminUid,
        'user_deletion',
        userToDelete.uid,
        'success'
      );

      this.showTemporaryMessage(`User ${userToDelete.email} deleted successfully!`);
      this.fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      this.showTemporaryMessage(`Failed to delete user: ${error.message}`, true);
    } finally {
      this.showConfirmModal = false;
    }
  }

  handleEditUser(user: AppUser): void {
    this.editingUser = user;
    this.userName = user.name;
    this.userEmail = user.email;
    this.userPassword = '';
    this.userConfirmPassword = '';

    this.userAuditLog = user.customization.auditLog;
    this.userOrgAnalytics = user.customization.orgAnalytics;
    this.userUserAnalytics = user.customization.userAnalytics;

    // Initialize userFileAccesses based on domainAssets and existing user's access
    const newFileAccesses = this.domainAssets.map(domainAsset => {
      const existingAccess = user.fileAccesses.find(fa => fa.assetKey === domainAsset.key);
      return {
        assetKey: domainAsset.key,
        hasAccess: existingAccess ? existingAccess.hasAccess : false
      };
    });
    this.userFileAccesses = newFileAccesses;
  }

  get filteredUsers(): AppUser[] {
    return this.users.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
