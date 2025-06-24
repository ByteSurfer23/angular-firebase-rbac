// create-user.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Firestore, arrayUnion, collection, doc, getDocs, setDoc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';
// import { NgModel } from '@angular/forms'; // NgModel is used via [(ngModel)], not directly imported as a type

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-4 max-w-xl mx-auto">
      <h2 class="text-2xl font-bold mb-4">Create User</h2>

      <div *ngIf="message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ message }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3" (click)="message = ''">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z"/></svg>
        </span>
      </div>

      <div class="mb-3">
        <label>Email:</label>
        <input class="w-full border p-2 rounded-md" [(ngModel)]="email" type="email" name="email" />
      </div>

      <div class="mb-3">
        <label>Password:</label>
        <input class="w-full border p-2 rounded-md" [(ngModel)]="password" type="password" name="password" />
      </div>

      <div class="mb-3">
        <label>Name:</label>
        <input class="w-full border p-2 rounded-md" [(ngModel)]="name" type="text" name="name" />
      </div>

      <div class="mb-3">
        <label>Customization:</label>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" [(ngModel)]="userAnalytics" name="userAnalytics" />
            <span>User Analytics</span>
          </label>
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" [(ngModel)]="orgAnalytics" name="orgAnalytics" />
            <span>Org Analytics</span>
          </label>
        </div>
        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" [(ngModel)]="auditLog" name="auditLog" />
            <span>Audit Log</span>
          </label>
        </div>
      </div>

      <div class="mb-4">
        <label class="font-semibold">Assign Domains:</label>
        <div *ngIf="domains.length === 0" class="text-gray-500">No domains found</div>
        <div *ngFor="let domain of domains" class="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            [value]="domain.id"
            (change)="toggleDomain(domain.id, $event)"
            name="domain_{{domain.id}}"
          />
          <label>{{ domain.name || domain.id }}</label>
        </div>
      </div>

      <button
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        (click)="createUser()"
      >
        Create User
      </button>
    </div>
  `,
  styles: [``]
})
export class CreateUserComponent implements OnInit {
  @Input() orgId!: string | null; // <-- MODIFIED: orgId is now an Input
  email = '';
  password = '';
  name = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;
  message = '';

  domains: any[] = [];
  selectedDomains: string[] = [];

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  async ngOnInit() {
    // this.orgId = localStorage.getItem('orgId') || ''; // <-- REMOVED: orgId is now an Input
    if (this.orgId) { // Now relies on orgId being passed in
      const domainCollection = collection(this.firestore, `organizations/${this.orgId}/domain`);
      try {
        const snapshot = await getDocs(domainCollection);
        this.domains = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching domains:", error);
        this.showTemporaryMessage('Error fetching domains.');
      }
    } else {
        this.showTemporaryMessage('Organization ID is required for user creation.');
    }
  }

  toggleDomain(domainId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDomains.push(domainId);
    } else {
      this.selectedDomains = this.selectedDomains.filter(id => id !== domainId);
    }
  }

  async createUser() {
    if (!this.orgId) { // Null check for orgId
      this.showTemporaryMessage('Organization ID is missing. Cannot create user.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const uid = userCredential.user.uid;
      const userRef = doc(this.firestore, `organizations/${this.orgId}/users/${uid}`);

      await setDoc(userRef, {
        uid,
        orgId: this.orgId,
        name: this.name,
        email: this.email,
        role: 'user',
        createdAt: new Date(),
        isActive: true,
        domains: this.selectedDomains,
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
        'user_creation',
        uid,
        'success'
      );

      this.showTemporaryMessage('User created successfully!');
      // Clear form fields after successful creation
      this.email = '';
      this.password = '';
      this.name = '';
      this.userAnalytics = false;
      this.orgAnalytics = false;
      this.auditLog = false;
      this.selectedDomains = [];

    } catch (error: any) {
      console.error("Error creating user:", error);
      this.showTemporaryMessage(`Error creating user: ${error.message}`);
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
