import { Component, Input, OnInit } from '@angular/core';
import {
  Firestore,
  arrayUnion,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore'; // Removed getDocs, query, where as they are no longer needed for fetching domain UIDs
import { FormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Ensure this path is correct

@Component({
  selector: 'app-create-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <form
      (ngSubmit)="createAdmin()"
      class="bg-white shadow-md rounded-xl p-6 max-w-md mx-auto space-y-4 mt-8"
    >
      <h3 class="text-xl font-semibold text-center text-gray-800">
        Create Admin
      </h3>

      <div
        *ngIf="message"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ message }}</span>
        <span
          class="absolute top-0 bottom-0 right-0 px-4 py-3"
          (click)="message = ''"
        >
          <svg
            class="fill-current h-6 w-6 text-green-500"
            role="button"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z"
            />
          </svg>
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

      <div class="space-y-2">
        <label class="block text-gray-700 font-medium mb-1"
          >Assign to Domains:</label
        >
        <div *ngIf="domains.length === 0" class="text-sm text-gray-500">
          No domains found for this organization.
        </div>

        <div *ngFor="let domain of domains" class="flex items-center space-x-2">
          <input
            type="checkbox"
            #domainCheckbox
            [checked]="domain.selected"
            (change)="onDomainSelectionChange(domain.uid, domainCheckbox.checked)"
            class="form-checkbox h-4 w-4 text-blue-600"
          />
          <span>{{ domain.name }}</span>
        </div>
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
export class CreateAdminComponent implements OnInit {
  @Input() orgId!: string | null;
  name = '';
  email = '';
  password = '';
  userAnalytics = false;
  orgAnalytics = false;
  auditLog = false;
  message = '';
  domain='';

  domains: { name: string; uid: string; selected: boolean }[] = [];
  selectedDomainUids: string[] = [];

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit(): void {
    this.fetchDomains();
  }

  async fetchDomains() {
    if (!this.orgId) {
      console.warn('orgId is not provided for fetching domains.');
      return;
    }
    try {
      const orgDocRef = doc(this.firestore, `organizations/${this.orgId}`);
      const orgDocSnap = await getDoc(orgDocRef);

      if (orgDocSnap.exists()) {
        const orgData = orgDocSnap.data();
        // Correctly read 'domains' as a map (object)
        const domainsMap: { [key: string]: string } = orgData?.['domains'] || {};

        // Convert the map entries directly into the desired array format
        this.domains = Object.entries(domainsMap).map(([name, uid]) => ({
          name: name,
          uid: uid,
          selected: false, // Initialize as not selected
        }));
      } else {
        this.showTemporaryMessage('Organization not found to fetch domains.');
        this.domains = [];
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      this.showTemporaryMessage('Failed to fetch domains.');
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
        'Organization ID is missing. Cannot create admin.'
      );
      return;
    }
    if (this.selectedDomainUids.length === 0) {
      this.showTemporaryMessage(
        'Please select at least one domain for the admin.'
      );
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const newAdminUid = userCredential.user.uid;

      for (const domainUid of this.selectedDomainUids) {
        // Construct the path for the admin document under each selected domain
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

        // Update the main domain document to list its associated admins
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
        actoruid || '',
        'admin_creation',
        newAdminUid,
        'success'
      );

      this.showTemporaryMessage('Admin created successfully!');
      this.name = '';
      this.email = '';
      this.password = '';
      this.userAnalytics = false;
      this.orgAnalytics = false;
      this.auditLog = false;
      this.selectedDomainUids = [];
      this.domains.forEach((d) => (d.selected = false));
    } catch (error: any) {
      console.error('Error creating admin:', error);
      this.showTemporaryMessage(`Error creating admin: ${error.message}`);
    }
  }

  showTemporaryMessage(msg: string) {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}