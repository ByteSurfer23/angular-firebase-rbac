// create-user.component.ts
import { Component, Input } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form
      (ngSubmit)="createUser()"
      class="bg-white shadow-md rounded-xl p-6 max-w-md mx-auto space-y-4 mt-8"
    >
      <h3 class="text-xl font-semibold text-center text-gray-800">
        Create Normal User
      </h3>

      <input
        [(ngModel)]="name"
        name="name"
        placeholder="User Name"
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
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
      >
        Create User
      </button>
    </form>
  `,
})
export class CreateUserComponent {
  @Input() orgId!: string | null;
  name = '';
  email = '';
  password = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;

  constructor(private firestore: Firestore, private auth: Auth) {}

  async createUser() {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.email,
      this.password
    );
    const uid = userCredential.user.uid;
    const userRef = doc(
      this.firestore,
      `organizations/${this.orgId}/users/${uid}`
    );
    await setDoc(userRef, {
      uid,
      orgId: this.orgId,
      name: this.name,
      email: this.email,
      role: 'user',
      createdAt: new Date(),
      isActive: true,
      customization: {
        userAnalytics: this.userAnalytics,
        orgAnalytics: this.orgAnalytics,
        auditLog: this.auditLog,
      },
    });
    // creating audit logs
    let actoruid = localStorage.getItem('uid');
    logAuditActionWithSetDoc(
      this.firestore,
      actoruid || '',
      'user_creation',
      uid, // Resource is the newly created user's UID
      'success'
    );

    alert('User created');
  }
}

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

  constructor(private firestore: Firestore, private auth: Auth) {}

  async createAdmin() {
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

    // create admin

    let actoruid = localStorage.getItem('uid');
    logAuditActionWithSetDoc(
      this.firestore,
      actoruid || '',
      'admin_creation',
      uid, // Resource is the newly created user's UID
      'success'
    );
    alert('Admin created');
  }
}
