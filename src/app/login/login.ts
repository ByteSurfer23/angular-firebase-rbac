// login.component.ts
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6"
    >
      <form
        (ngSubmit)="login()"
        class="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 class="text-xl font-semibold text-center text-gray-800">Login</h2>
        <input
          [(ngModel)]="email"
          name="email"
          placeholder="Email"
          required
          class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          [(ngModel)]="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>

      <button
        (click)="goToSignup()"
        class="mt-4 text-blue-600 hover:text-blue-800 font-medium transition"
      >
        Create New Organization
      </button>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async login() {
    try {
      const userCred = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      console.log(userCred.user);
      const uid = userCred.user.uid;

      // Find user's role by scanning through organizations
      const orgsSnap = await getDocs(
        collection(this.firestore, 'organizations')
      );
      let role = '';
      let customization = '';
      let orgId = '';
      // here userRef is just referencing the path to the doc
      // getDoc actually gets the doc
      for (const orgDoc of orgsSnap.docs) {
        const userRef = doc(
          this.firestore,
          `organizations/${orgDoc.id}/users/${uid}`
        );
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          role = userSnap.data()?.['role'] || '';
          customization = userSnap.data()?.['customization'] || '';
          orgId = userSnap.data()?.['orgId'] || ''
          break;
        }
      }

      if (!role) throw new Error('User role not found');
      localStorage.setItem('userRole', role); // here the user's role is being stored as a key value pair

      if (!customization) throw new Error('User customization not found');
      localStorage.setItem('customization', JSON.stringify(customization));
      // where key = userRole and role is the value itself
      // this is stored in localstorage

      if (!orgId) throw new Error('User organization not found');
      localStorage.setItem('orgId', orgId);
      
      if (!uid) throw new Error('User not found');
      localStorage.setItem('uid', uid);

      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed.');
    }
  }

  goToSignup() {
    this.router.navigate(['/root-signup']);
  }
}
