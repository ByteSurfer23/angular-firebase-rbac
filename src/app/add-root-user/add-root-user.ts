// add-root-user.component.ts
import { Component } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-add-root-user',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <form (ngSubmit)="addRootUser()" class="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
      <h2 class="text-xl font-semibold text-center text-gray-800">Create Organization & Root User</h2>
      <input [(ngModel)]="orgName" name="orgName" placeholder="Organization Name" required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input [(ngModel)]="rootName" name="rootName" placeholder="Root User Name" required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input [(ngModel)]="email" name="email" placeholder="User Email" required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input [(ngModel)]="password" name="password" type="password" placeholder="Password" required
        class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <div class="flex flex-col space-y-2">
        <label><input type="checkbox" [(ngModel)]="customization.userAnalytics" name="userAnalytics" /> Enable User Analytics</label>
        <label><input type="checkbox" [(ngModel)]="customization.orgAnalytics" name="orgAnalytics" /> Enable Org Analytics</label>
        <label><input type="checkbox" [(ngModel)]="customization.auditLog" name="auditLog" /> Enable Audit Log</label>
      </div>

      <button type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
        Create Organization & Root User
      </button>
    </form>
  </div>
`
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

  constructor(private firestore: Firestore, private router: Router, private auth: Auth) {}

  async addRootUser() {
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

      alert('Organization and root user created successfully');
      this.router.navigate(['']);
    } catch (err) {
      console.error('Error creating organization/root user:', err);
      alert('Failed to create organization/root user');
    }
  }
}
