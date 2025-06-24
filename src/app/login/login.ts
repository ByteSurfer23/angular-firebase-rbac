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

      let role = '';
      let customization = '';
      let orgId = '';

      // First, try to find the user as a 'root' admin directly under an organization
      const orgsSnap = await getDocs(
        collection(this.firestore, 'organizations')
      );

      for (const orgDoc of orgsSnap.docs) {
        const rootAdminRef = doc(
          this.firestore,
          `organizations/${orgDoc.id}/root/${uid}`
        );
        const rootAdminSnap = await getDoc(rootAdminRef);

        if (rootAdminSnap.exists() && rootAdminSnap.data()?.['role'] === 'root') {
          role = 'root';
          customization = rootAdminSnap.data()?.['customization'] || '';
          orgId = orgDoc.id;
          break; // Root user found, no need to check further
        }
      }

      // If not a 'root' user, proceed to check the deeply nested structure
      if (!role) {
        const userDomain = this.email.split('@')[1];

        for (const orgDoc of orgsSnap.docs) {
          orgId = orgDoc.id; // Potential orgId

          // 2. Check within the 'domains' subcollection for the user's domain
          const domainsSnap = await getDocs(
            collection(this.firestore, `organizations/${orgId}/domains`)
          );

          for (const domainDoc of domainsSnap.docs) {
            // Assuming domainDoc.id is the actual domain name (e.g., 'example.com')
            if (domainDoc.id === userDomain) {
              const domainId = domainDoc.id;

              // 3. Check within the 'admins' subcollection of that domain
              const domainAdminsSnap = await getDocs(
                collection(
                  this.firestore,
                  `organizations/${orgId}/domains/${domainId}/admins`
                )
              );

              for (const adminDoc of domainAdminsSnap.docs) {
                // Now, check if this admin has a 'projects' subcollection
                const projectsSnap = await getDocs(
                  collection(
                    this.firestore,
                    `organizations/${orgId}/domains/${domainId}/admins/${adminDoc.id}/projects`
                  )
                );

                for (const projectDoc of projectsSnap.docs) {
                  // 4. Finally, check within the 'users' subcollection of that project
                  const projectUsersSnap = await getDocs(
                    collection(
                      this.firestore,
                      `organizations/${orgId}/domains/${domainId}/admins/${adminDoc.id}/projects/${projectDoc.id}/users`
                    )
                  );

                  for (const userDoc of projectUsersSnap.docs) {
                    if (userDoc.id === uid) {
                      role = userDoc.data()?.['role'] || '';
                      customization = userDoc.data()?.['customization'] || '';
                      // orgId is already set
                      break; // User found, stop checking projects
                    }
                  }
                  if (role) break; // User found in a project, stop checking projects
                }
                if (role) break; // User found in an admin's projects, stop checking admins
              }
            }
            if (role) break; // User found in a domain's hierarchy, stop checking domains
          }
          if (role) break; // User found in this organization, stop checking other organizations
        }
      }

      if (!role) {
        throw new Error('User role not found or not authorized.');
      }

      localStorage.setItem('userRole', role);
      localStorage.setItem('customization', JSON.stringify(customization));
      localStorage.setItem('orgId', orgId);
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