// create-user.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Firestore, arrayUnion, collection, doc, getDocs, setDoc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';
// import { NgModel } from '@angular/forms'; // NgModel is used via [(ngModel)], not directly imported as a type

// create-admin.component.ts

@Component({
  selector: 'app-create-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form
      (ngSubmit)="createAdmin()"
      class="bg-white shadow-md rounded-xl p-6 max-w-md mx-auto space-y-4 mt-8"
    >
      <h3 class="text-xl font-semibold text-center text-gray-800">
        Create Admin
      </h3>

      <div *ngIf="message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ message }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" (click)="message = ''">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z"/></svg>
        </span>
      </div>

      <input
        [(ngModel)]="name"
        name="name"
        placeholder="Admin Name"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        [(ngModel)]="email"
        name="email"
        placeholder="Email"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        [(ngModel)]="password"
        name="password"
        type="password"
        placeholder="Password"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div class="space-y-2">
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            [(ngModel)]="userAnalytics"
            name="userAnalytics"
          />
          <span>User Analytics</span>
        </label>
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            [(ngModel)]="orgAnalytics"
            name="orgAnalytics"
          />
          <span>Org Analytics</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="checkbox" [(ngModel)]="auditLog" name="auditLog" />
          <span>Audit Log</span>
        </label>
      </div>

      <button
        type="submit"
        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
      >
        Create Admin
      </button>
    </form>
  `,
})
export class CreateAdminComponent {
  @Input() orgId!: string | null;
  name = '';
  email = '';
  password = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;
  message = ''; // Added for temporary messages

  constructor(private firestore: Firestore, private auth: Auth) {}

  async createAdmin() {
    if (!this.orgId) { // Null check for orgId
      this.showTemporaryMessage('Organization ID is missing. Cannot create admin.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const uid = userCredential.user.uid;
      const adminRef = doc(
        this.firestore,
        `organizations/${this.orgId}/admins/${uid}`
      );
      await setDoc(adminRef, {
        uid,
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
      });

      const actoruid = localStorage.getItem('uid');
      logAuditActionWithSetDoc(
        this.firestore,
        actoruid || '',
        'admin_creation',
        uid, // Resource is the newly created user's UID
        'success'
      );
      this.showTemporaryMessage('Admin created successfully!');
      // Clear form fields
      this.name = '';
      this.email = '';
      this.password = '';
      this.userAnalytics = false;
      this.orgAnalytics = false;
      this.auditLog = false;

    } catch (error: any) {
      console.error("Error creating admin:", error);
      this.showTemporaryMessage(`Error creating admin: ${error.message}`);
    }
  }

  // Helper to show messages temporarily
  showTemporaryMessage(msg: string) {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
    }, 5000); // Message disappears after 5 seconds
  }
}


@Component({
  selector: 'app-create-domain',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form
      (ngSubmit)="createDomain()"
      class="bg-white shadow-md rounded-xl p-6 max-w-md mx-auto space-y-4 mt-8"
    >
      <h3 class="text-xl font-semibold text-center text-gray-800">
        Create Domain
      </h3>

      <div *ngIf="message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ message }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" (click)="message = ''">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z"/></svg>
        </span>
      </div>

      <input
        [(ngModel)]="name"
        name="name"
        placeholder="Domain Name"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        [(ngModel)]="email"
        name="email"
        placeholder="Email"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        [(ngModel)]="password"
        name="password"
        type="password"
        placeholder="Password"
        required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div class="space-y-2">
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            [(ngModel)]="userAnalytics"
            name="userAnalytics"
          />
          <span>User Analytics</span>
        </label>
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            [(ngModel)]="orgAnalytics"
            name="orgAnalytics"
          />
          <span>Org Analytics</span>
        </label>
        <label class="flex items-center space-x-2">
          <input type="checkbox" [(ngModel)]="auditLog" name="auditLog" />
          <span>Audit Log</span>
        </label>
      </div>

      <button
        type="submit"
        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
      >
        Create Domain
      </button>
    </form>
  `,
})

export class CreateDomainComponent {
  @Input() orgId!: string | null;
  name = '';
  email = '';
  password = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;
  message = ''; // Added for temporary messages

  constructor(private firestore: Firestore, private auth: Auth) {}

  async createDomain() {
    if (!this.orgId) { // Null check for orgId
      this.showTemporaryMessage('Organization ID is missing. Cannot create domain.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const uid = userCredential.user.uid;
      // Corrected collection path for domains to be under the organization
      const domainRef = doc(
        this.firestore,
        `organizations/${this.orgId}/domain/${uid}`
      );

      await setDoc(domainRef, {
        uid,
        orgId: this.orgId,
        name: this.name,
        email: this.email,
        role: 'domain_root', // Role for domain
        createdAt: new Date(),
        isActive: true,
        customization: {
          userAnalytics: this.userAnalytics,
          orgAnalytics: this.orgAnalytics,
          auditLog: this.auditLog,
        },
      });
      const orgId = localStorage.getItem('orgId');
      const orgRef = doc(this.firestore, `organizations/${orgId}`);
    await updateDoc(orgRef, {
      domains: arrayUnion(this.name)
    })
      const actoruid = localStorage.getItem('uid');
      logAuditActionWithSetDoc(
        this.firestore,
        actoruid || '', // Null check for actoruid
        'domain_creation',
        uid, // Resource is the newly created domain's UID (which is also the user's UID)
        'success'
      );
      this.showTemporaryMessage('Domain created successfully!');
      // Clear form fields
      this.name = '';
      this.email = '';
      this.password = '';
      this.userAnalytics = false;
      this.orgAnalytics = false;
      this.auditLog = false;

    } catch (error: any) {
      console.error("Error creating domain:", error);
      this.showTemporaryMessage(`Error creating domain: ${error.message}`);
    }
  }

  // Helper to show messages temporarily
  showTemporaryMessage(msg: string) {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
    }, 5000); // Message disappears after 5 seconds
  }
}
