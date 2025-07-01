// src/app/project-user-assigner/project-user-assigner.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { AssignedUser, ProjectDocument } from '../models/models'; // Adjust path if your models.ts is elsewhere
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Import audit log function

@Component({
  selector: 'app-project-user-assigner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 rounded-xl overflow-hidden">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }

        /* Custom Scrollbar for dark theme */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937; /* gray-800 */
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4b5563; /* gray-600 */
            border-radius: 4px;
            border: 2px solid #1f2937; /* gray-800 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280; /* gray-500 */
        }
      </style>

      <header class="bg-gray-800 p-4 rounded-xl shadow-lg mb-6 text-center">
        <h1 class="text-3xl font-bold text-blue-400 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-8 w-8 text-green-300">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="M15 6 18 9"/>
          </svg>
          Project User Assignment
        </h1>
        <p class="text-sm text-gray-400 mt-2">
          Organization: <span class="font-semibold text-blue-300">{{ orgId || 'N/A' }}</span> |
          Domain: <span class="font-semibold text-blue-300">{{ domainUid || 'N/A' }}</span>
        </p>
      </header>

      <!-- Messages -->
      <div *ngIf="message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ message }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" (click)="message = ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-green-500">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </span>
      </div>

      <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" (click)="errorMessage = ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-red-500">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </span>
      </div>

      <main class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Project Search & Selection -->
        <section class="lg:w-1/2 bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
          <h3 class="text-2xl font-bold text-center text-blue-300 mb-4">Select Project</h3>
          <div class="mb-4">
            <input
              type="text"
              placeholder="Search projects by name or description..."
              [(ngModel)]="searchTermProjects"
              name="searchTermProjects"
              class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="overflow-y-auto max-h-96 custom-scrollbar flex-grow">
            <table class="min-w-full bg-gray-900 rounded-md overflow-hidden">
              <thead>
                <tr class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal">
                  <th class="py-3 px-6 text-left">Project Name</th>
                  <th class="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
                <tr *ngFor="let project of filteredProjects" class="border-b border-gray-700 hover:bg-gray-700">
                  <td class="py-3 px-6 text-left whitespace-nowrap">{{ project.name }}</td>
                  <td class="py-3 px-6 text-center">
                    <button (click)="selectProject(project)"
                            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                            [disabled]="selectedProject?.uid === project.uid">
                      {{ selectedProject?.uid === project.uid ? 'Selected' : 'Select' }}
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredProjects.length === 0">
                  <td colspan="2" class="py-4 text-center text-gray-500">No projects found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Right Column: User Search & Assignment for Selected Project -->
        <section *ngIf="selectedProject" class="lg:w-1/2 bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
          <h3 class="text-2xl font-bold text-center text-blue-300 mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-6 w-6 text-yellow-300">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Assign Users to: <span class="text-green-300 ml-2">{{ selectedProject.name }}</span>
            <button (click)="selectedProject = null" class="ml-4 text-gray-400 hover:text-gray-200 text-sm">
              (Clear Project)
            </button>
          </h3>

          <div class="mb-4">
            <label for="userSearch" class="block text-gray-300 text-sm font-bold mb-2">Search Users by Email:</label>
            <input
              type="text"
              id="userSearch"
              placeholder="Search users by email..."
              [(ngModel)]="userSearchTerm"
              name="userSearchTerm"
              class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="overflow-y-auto max-h-60 custom-scrollbar mb-4 border border-gray-700 rounded-md flex-grow">
            <table class="min-w-full bg-gray-900">
              <thead>
                <tr class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal">
                  <th class="py-3 px-6 text-left">Select</th>
                  <th class="py-3 px-6 text-left">User Email</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
                <tr *ngFor="let user of filteredAllDomainUsers" class="border-b border-gray-700 hover:bg-gray-700">
                  <td class="py-3 px-6 text-left">
                    <input
                      type="checkbox"
                      [checked]="isUserAssignedToProject(user)"
                      (change)="toggleUserAssignmentToProject(user, $event)"
                      class="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td class="py-3 px-6 text-left">{{ user.email }}</td>
                </tr>
                <tr *ngIf="filteredAllDomainUsers.length === 0">
                  <td colspan="2" class="py-4 text-center text-gray-500">No users found.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-center mt-4">
            <button (click)="saveProjectUsers()"
                    class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                    [disabled]="!selectedProject">
              Save Assigned Users
            </button>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class ProjectUserAssignerComponent implements OnInit {
  // Properties to be read from localStorage
  orgId: string | null = null;
  domainUid: string | null = null;
  adminUid: string | null = null; // Used for audit logging

  // Project Management State
  projectsList: ProjectDocument[] = [];
  searchTermProjects: string = '';
  selectedProject: ProjectDocument | null = null;

  // User Management State for Project Assignment
  allDomainUsers: AssignedUser[] = [];
  userSearchTerm: string = '';
  // This array holds the users currently selected in the checkboxes for the *currently selected project*
  tempSelectedProjectUsers: AssignedUser[] = [];

  // Messages
  message: string = '';
  errorMessage: string = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // Read organization, domain, and admin UIDs from local storage
    this.orgId = localStorage.getItem('orgId');
    this.domainUid = localStorage.getItem('domainUid');
    this.adminUid = localStorage.getItem('uid'); // Assuming 'uid' is the admin's UID

    if (!this.orgId || !this.domainUid) {
      this.showTemporaryMessage('Error: Organization ID or Domain ID missing from local storage. Cannot load data.', true);
      console.error('OrgId or DomainUid missing from localStorage.');
    }
    if (!this.adminUid) {
      this.showTemporaryMessage('Error: Admin UID missing from local storage. Audit logging may be affected.', true);
      console.error('Admin UID missing from localStorage.');
    }

    // Fetch projects and domain users on component initialization
    if (this.orgId && this.domainUid) {
      this.fetchProjects();
      this.fetchAllDomainUsers();
    }
  }

  // --- Utility Methods ---
  showTemporaryMessage(msg: string, isError: boolean = false) {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    } else {
      this.message = msg;
      setTimeout(() => { this.message = ''; }, 5000);
    }
  }

  // --- Project Management Methods ---
  async fetchProjects(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.projectsList = [];
      return;
    }
    try {
      const projectsCollectionRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/projects`);
      const q = query(projectsCollectionRef, orderBy('createdAt', 'desc')); // Order by creation date
      const querySnapshot = await getDocs(q);
      this.projectsList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as ProjectDocument));
    } catch (error) {
      console.error('Error fetching projects:', error);
      this.showTemporaryMessage('Failed to load projects.', true);
    }
  }

  get filteredProjects(): ProjectDocument[] {
    if (!this.searchTermProjects) {
      return this.projectsList;
    }
    const lowerCaseSearchTerm = this.searchTermProjects.toLowerCase();
    return this.projectsList.filter(project =>
      project.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      project.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  selectProject(project: ProjectDocument): void {
    this.selectedProject = project;
    // Initialize tempSelectedProjectUsers with the project's current assigned users
    this.tempSelectedProjectUsers = [...(project.usersWorkingOnProject || [])];
    this.showTemporaryMessage(`Project "${project.name}" selected for user assignment.`);
  }

  // --- User Assignment Methods ---
  async fetchAllDomainUsers(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.allDomainUsers = [];
      return;
    }

    try {
      const usersRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/users`);
      const usersSnap = await getDocs(usersRef);
      const users = usersSnap.docs.map(doc => ({ uid: doc.id, email: doc.data()['email'] as string }));

      const adminsRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/admins`);
      const adminsSnap = await getDocs(adminsRef);
      const admins = adminsSnap.docs.map(doc => ({ uid: doc.id, email: doc.data()['email'] as string }));

      // Combine users and admins, ensuring no duplicates by UID
      const combinedUsersMap = new Map<string, AssignedUser>();
      [...users, ...admins].forEach(user => {
        combinedUsersMap.set(user.uid, user);
      });
      this.allDomainUsers = Array.from(combinedUsersMap.values());

    } catch (error) {
      console.error("Error fetching domain users/admins:", error);
      this.showTemporaryMessage("Failed to load domain users for assignment.", true);
    }
  }

  get filteredAllDomainUsers(): AssignedUser[] {
    if (!this.userSearchTerm) {
      return this.allDomainUsers;
    }
    const lowerCaseSearchTerm = this.userSearchTerm.toLowerCase();
    return this.allDomainUsers.filter(user =>
      user.email.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  isUserAssignedToProject(user: AssignedUser): boolean {
    // Check against the temporary selection array
    return this.tempSelectedProjectUsers.some(u => u.uid === user.uid);
  }

  toggleUserAssignmentToProject(user: AssignedUser, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // Add user if not already in the temporary array
      if (!this.tempSelectedProjectUsers.some(u => u.uid === user.uid)) {
        this.tempSelectedProjectUsers.push(user);
      }
    } else {
      // Remove user from the temporary array
      this.tempSelectedProjectUsers = this.tempSelectedProjectUsers.filter(u => u.uid !== user.uid);
    }
  }

  async saveProjectUsers(): Promise<void> {
    if (!this.selectedProject || !this.orgId || !this.domainUid) {
      this.showTemporaryMessage('Please select a project first and ensure organization/domain IDs are available.', true);
      return;
    }

    try {
      const projectDocRef = doc(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/projects`,
        this.selectedProject.uid
      );

      // Update the usersWorkingOnProject array in Firestore
      await updateDoc(projectDocRef, {
        usersWorkingOnProject: this.tempSelectedProjectUsers
      });

      // Update the local selectedProject object immediately for UI consistency
      this.selectedProject.usersWorkingOnProject = [...this.tempSelectedProjectUsers];

      // Refresh the main projects list to ensure the updated project data is visible
      await this.fetchProjects();

      // Audit logging
      if (this.adminUid && this.selectedProject.uid) {
        logAuditActionWithSetDoc(
          this.firestore,
          this.adminUid,
          'project_users_update',
          this.selectedProject.uid,
          'success'
        );
      } else {
        console.warn("Admin UID or Project ID not found for audit logging.");
      }

      this.showTemporaryMessage('Project users updated successfully!');
    } catch (error: any) {
      console.error('Error updating project users:', error);
      this.showTemporaryMessage(`Failed to update project users: ${error.message || 'An unknown error occurred.'}`, true);
      if (this.adminUid && this.selectedProject?.uid) {
         logAuditActionWithSetDoc(
            this.firestore,
            this.adminUid,
            'project_users_update',
            this.selectedProject.uid,
            'failed'
         );
      }
    }
  }
}