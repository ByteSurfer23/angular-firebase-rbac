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
  getDoc, // Added to fetch individual user docs
} from '@angular/fire/firestore';
// Import UserWithAssetAccess and UserProjectAssignment from models.ts
import {
  AssignedUser,
  ProjectDocument,
  UserProjectAssetAccess,
  UserWithAssetAccess,
  UserProjectAssignment // Import UserProjectAssignment
} from '../models/models';
// No longer importing AppUser from domain-admin-usercrud.ts
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Import audit log function

@Component({
  selector: 'app-project-user-assigner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 rounded-xl overflow-hidden"
    >
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }

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
        <h1
          class="text-3xl font-bold text-blue-400 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-3 h-8 w-8 text-green-300"
          >
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="M15 6 18 9" />
          </svg>
          Project User Assignment
        </h1>
        <p class="text-sm text-gray-400 mt-2">
          Organization:
          <span class="font-semibold text-blue-300">{{ orgId || 'N/A' }}</span>
          | Domain:
          <span class="font-semibold text-blue-300">{{
            domainUid || 'N/A'
          }}</span>
        </p>
      </header>

      <!-- Messages -->
      <div
        *ngIf="message"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ message }}</span>
        <span
          class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
          (click)="message = ''"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6 text-green-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </span>
      </div>

      <div
        *ngIf="errorMessage"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ errorMessage }}</span>
        <span
          class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
          (click)="errorMessage = ''"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6 text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </span>
      </div>

      <main class="flex flex-col lg:flex-row gap-6">
        <!-- Left Column: Project Search & Selection -->
        <section
          class="lg:w-1/2 bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col"
        >
          <h3 class="text-2xl font-bold text-center text-blue-300 mb-4">
            Select Project
          </h3>
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
                <tr
                  class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal"
                >
                  <th class="py-3 px-6 text-left">Project Name</th>
                  <th class="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
                <tr
                  *ngFor="let project of filteredProjects"
                  class="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td class="py-3 px-6 text-left whitespace-nowrap">
                    {{ project.name }}
                  </td>
                  <td class="py-3 px-6 text-center">
                    <button
                      (click)="selectProject(project)"
                      class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                      [disabled]="selectedProject?.uid === project.uid"
                    >
                      {{
                        selectedProject?.uid === project.uid
                          ? 'Selected'
                          : 'Select'
                      }}
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredProjects.length === 0">
                  <td colspan="2" class="py-4 text-center text-gray-500">
                    No projects found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Right Column: User Search & Assignment for Selected Project -->
        <section
          *ngIf="selectedProject"
          class="lg:w-1/2 bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col"
        >
          <h3
            class="text-2xl font-bold text-center text-blue-300 mb-4 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mr-3 h-6 w-6 text-yellow-300"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Assign Users to:
            <span class="text-green-300 ml-2">{{ selectedProject.name }}</span>
            <button
              (click)="selectedProject = null"
              class="ml-4 text-gray-400 hover:text-gray-200 text-sm"
            >
              (Clear Project)
            </button>
          </h3>

          <div class="mb-4">
            <label
              for="userSearch"
              class="block text-gray-300 text-sm font-bold mb-2"
              >Search Users by Email:</label
            >
            <input
              type="text"
              id="userSearch"
              placeholder="Search users by email..."
              [(ngModel)]="userSearchTerm"
              name="userSearchTerm"
              class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div
            class="overflow-y-auto max-h-96 custom-scrollbar mb-4 border border-gray-700 rounded-md flex-grow"
          >
            <table class="min-w-full bg-gray-900">
              <thead>
                <tr
                  class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal"
                >
                  <th class="py-3 px-6 text-left">User Email</th>
                  <th class="py-3 px-6 text-center">Assign to Project</th>
                  <th class="py-3 px-6 text-center">Manage Assets</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
                <ng-container *ngFor="let user of filteredAllDomainUsers">
                  <tr class="border-b border-gray-700 hover:bg-gray-700">
                    <td class="py-3 px-6 text-left">{{ user.email }}</td>
                    <td class="py-3 px-6 text-center">
                      <input
                        type="checkbox"
                        [checked]="isUserAssignedToProject(user)"
                        (change)="toggleUserAssignmentToProject(user, $event)"
                        class="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td class="py-3 px-6 text-center">
                      <button
                        (click)="toggleUserAssetAccessDisplay(user.uid)"
                        class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        {{
                          isUserAssetAccessVisible(user.uid)
                            ? 'Hide Assets'
                            : 'Show Assets'
                        }}
                      </button>
                    </td>
                  </tr>
                  <!-- Asset Access Row (conditionally displayed) -->
                  <tr
                    *ngIf="
                      isUserAssetAccessVisible(user.uid) &&
                      selectedProject.assets.length > 0
                    "
                    class="bg-gray-800 border-b border-gray-700"
                  >
                    <td colspan="3" class="p-4">
                      <div
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        <label
                          *ngFor="let asset of selectedProject.assets"
                          class="flex items-center space-x-2 text-gray-300 text-sm"
                        >
                          <input
                            type="checkbox"
                            [checked]="
                              getAssetAccessForUser(user.uid, asset.key)
                            "
                            (change)="
                              onAssetAccessChange(user.uid, asset.key, $event)
                            "
                            class="form-checkbox h-4 w-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                          />
                          <span>{{ asset.key }}</span>
                        </label>
                      </div>
                      <p
                        *ngIf="selectedProject.assets.length === 0"
                        class="text-gray-500 text-sm mt-2"
                      >
                        No assets defined for this project.
                      </p>
                    </td>
                  </tr>
                </ng-container>
                <tr *ngIf="filteredAllDomainUsers.length === 0">
                  <td colspan="3" class="py-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-center mt-4">
            <button
              (click)="saveProjectAssignments()"
              class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
              [disabled]="!selectedProject"
            >
              Save Project Assignments
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
  allDomainUsers: AssignedUser[] = []; // Basic user info (uid, email)
  // Changed from AppUser[] to UserWithAssetAccess[]
  allDomainUsersWithAccess: UserWithAssetAccess[] = []; // Full user objects with fileAccesses

  userSearchTerm: string = '';
  // This array holds the users currently selected in the checkboxes for the *currently selected project*
  tempSelectedProjectUsers: AssignedUser[] = [];

  // NEW: State for managing asset access per user for the selected project
  // Map<userId, Map<assetKey, boolean>>
  userAssetAccessState: Map<string, Map<string, boolean>> = new Map();
  // NEW: State to control visibility of asset access checkboxes
  expandedUserAssetAccess: Set<string> = new Set();

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
      this.showTemporaryMessage(
        'Error: Organization ID or Domain ID missing from local storage. Cannot load data.',
        true
      );
      console.error('OrgId or DomainUid missing from localStorage.');
    }
    if (!this.adminUid) {
      this.showTemporaryMessage(
        'Error: Admin UID missing from local storage. Audit logging may be affected.',
        true
      );
      console.error('Admin UID missing from localStorage.');
    }

    // Fetch projects and domain users on component initialization
    if (this.orgId && this.domainUid) {
      this.fetchProjects();
      this.fetchAllDomainUsers(); // This will now fetch user objects with asset access
    }
  }

  // --- Utility Methods ---
  showTemporaryMessage(msg: string, isError: boolean = false) {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    } else {
      this.message = msg;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    }
  }

  // Inside ProjectUserAssignerComponent class
  onAssetAccessChange(userId: string, assetKey: string, event: Event): void {
    // Safely cast and access the checked property
    const target = event.target as HTMLInputElement;
    const isChecked = target ? target.checked : false; // Add a null check for target
    this.updateAssetAccessForUser(userId, assetKey, isChecked);
  }
  // --- Project Management Methods ---
  async fetchProjects(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.projectsList = [];
      return;
    }
    try {
      const projectsCollectionRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/projects`
      );
      // Removed orderBy as per previous instructions to avoid index issues.
      const querySnapshot = await getDocs(projectsCollectionRef);
      this.projectsList = querySnapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as ProjectDocument)
      );
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
    return this.projectsList.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        project.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  async selectProject(project: ProjectDocument): Promise<void> {
    this.selectedProject = project;
    // Initialize tempSelectedProjectUsers with the project's current assigned users
    this.tempSelectedProjectUsers = [...(project.usersWorkingOnProject || [])];
    this.showTemporaryMessage(
      `Project "${project.name}" selected for user assignment.`
    );

    // NEW: Load asset access state for all users for this selected project
    await this.loadUserAssetAccessForSelectedProject();
    this.expandedUserAssetAccess.clear(); // Collapse all asset sections initially
  }

  // --- User Assignment Methods ---
  async fetchAllDomainUsers(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.allDomainUsers = [];
      this.allDomainUsersWithAccess = [];
      return;
    }

    try {
      const usersRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/users`
      );
      const usersSnap = await getDocs(usersRef);
      // Cast to UserWithAssetAccess
      const users = usersSnap.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as UserWithAssetAccess)
      );

      const adminsRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/admins`
      );
      const adminsSnap = await getDocs(adminsRef);
      // Cast to UserWithAssetAccess
      const admins = adminsSnap.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as UserWithAssetAccess)
      );

      // Combine users and admins, ensuring no duplicates by UID
      const combinedUsersMap = new Map<string, UserWithAssetAccess>();
      [...users, ...admins].forEach((user) => {
        combinedUsersMap.set(user.uid, user);
      });
      this.allDomainUsersWithAccess = Array.from(combinedUsersMap.values());

      // Populate allDomainUsers (basic info) for project assignment checkboxes
      this.allDomainUsers = this.allDomainUsersWithAccess.map((u) => ({
        uid: u.uid,
        email: u.email,
      }));
    } catch (error) {
      console.error('Error fetching domain users/admins:', error);
      this.showTemporaryMessage(
        'Failed to load domain users for assignment.',
        true
      );
    }
  }

  // Changed type from AppUser[] to UserWithAssetAccess[]
  get filteredAllDomainUsers(): UserWithAssetAccess[] {
    if (!this.userSearchTerm) {
      return this.allDomainUsersWithAccess;
    }
    const lowerCaseSearchTerm = this.userSearchTerm.toLowerCase();
    return this.allDomainUsersWithAccess.filter((user) =>
      user.email.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  isUserAssignedToProject(user: AssignedUser): boolean {
    // Check against the temporary selection array
    return this.tempSelectedProjectUsers.some((u) => u.uid === user.uid);
  }

  toggleUserAssignmentToProject(user: AssignedUser, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // Add user if not already in the temporary array
      if (!this.tempSelectedProjectUsers.some((u) => u.uid === user.uid)) {
        this.tempSelectedProjectUsers.push(user);
      }
    } else {
      // Remove user from the temporary array
      this.tempSelectedProjectUsers = this.tempSelectedProjectUsers.filter(
        (u) => u.uid !== user.uid
      );
    }
  }

  /**
   * Loads the asset access state for all users for the currently selected project.
   * This populates `userAssetAccessState` for UI rendering.
   * It ensures that only asset access entries relevant to the selected project are considered.
   */
  private async loadUserAssetAccessForSelectedProject(): Promise<void> {
    if (!this.selectedProject || !this.orgId || !this.domainUid) {
      this.userAssetAccessState.clear();
      return;
    }

    this.userAssetAccessState.clear(); // Clear previous state for a new project selection

    for (const user of this.allDomainUsersWithAccess) {
      const userAccessMap = new Map<string, boolean>();
      // Initialize all assets for this project to false for this user
      this.selectedProject.assets.forEach((asset) => {
        userAccessMap.set(asset.key, false);
      });

      // Check if the user has existing access for assets in this specific project
      // Ensure user.fileAccesses is an array before filtering
      const userFileAccessesArray: UserProjectAssetAccess[] = Array.isArray(
        user.fileAccesses
      )
        ? user.fileAccesses
        : [];

      userFileAccessesArray
        .filter(
          (access) =>
            access.projectId === this.selectedProject?.uid && access.hasAccess
        ) // Filter by current project ID
        .forEach((access) => {
          userAccessMap.set(access.assetKey, true); // Set to true if access exists and is true for THIS project
        });
      this.userAssetAccessState.set(user.uid, userAccessMap);
    }
  }

  /**
   * Gets the asset access status for a specific user and asset key for the selected project.
   */
  getAssetAccessForUser(userId: string, assetKey: string): boolean {
    return this.userAssetAccessState.get(userId)?.get(assetKey) || false;
  }

  /**
   * Updates the asset access status in the temporary state for a specific user and asset.
   */
  updateAssetAccessForUser(
    userId: string,
    assetKey: string,
    isChecked: boolean
  ): void {
    const userMap = this.userAssetAccessState.get(userId);
    if (userMap) {
      userMap.set(assetKey, isChecked);
    } else {
      console.warn(`User map not found for UID: ${userId}`);
    }
  }

  /**
   * Toggles the visibility of a user's asset access checkboxes in the UI.
   */
  toggleUserAssetAccessDisplay(userId: string): void {
    if (this.expandedUserAssetAccess.has(userId)) {
      this.expandedUserAssetAccess.delete(userId);
    } else {
      this.expandedUserAssetAccess.add(userId);
    }
  }

  /**
   * Checks if a user's asset access checkboxes should be visible.
   */
  isUserAssetAccessVisible(userId: string): boolean {
    return this.expandedUserAssetAccess.has(userId);
  }

  async saveProjectAssignments(): Promise<void> {
    if (!this.selectedProject || !this.orgId || !this.domainUid) {
      this.showTemporaryMessage(
        'Please select a project first and ensure organization/domain IDs are available.',
        true
      );
      return;
    }

    try {
      // 1. Update the project's usersWorkingOnProject array
      const projectDocRef = doc(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/projects`,
        this.selectedProject.uid
      );
      await updateDoc(projectDocRef, {
        usersWorkingOnProject: this.tempSelectedProjectUsers,
      });
      console.log(
        `Project ${this.selectedProject.name} usersWorkingOnProject updated.`
      );

      // Update the local selectedProject object immediately for UI consistency
      this.selectedProject.usersWorkingOnProject = [
        ...this.tempSelectedProjectUsers,
      ];

      // 2. Update each user's fileAccesses and projectAssignments arrays based on current state
      for (const user of this.allDomainUsersWithAccess) {
        const userAccessMapForProject = this.userAssetAccessState.get(user.uid);
        // We will always update projectAssignments, even if no asset access changes
        // if (!userAccessMapForProject) {
        //   continue; // No asset access changes for this user in this project
        // }

        let userDocRef;
        // Try to get user from 'users' collection first
        userDocRef = doc(
          this.firestore,
          `organizations/${this.orgId}/domain/${this.domainUid}/users/${user.uid}`
        );
        let userDocSnap = await getDoc(userDocRef);

        // If not found in 'users', try 'admins' collection
        if (!userDocSnap.exists()) {
          userDocRef = doc(
            this.firestore,
            `organizations/${this.orgId}/domain/${this.domainUid}/admins/${user.uid}`
          );
          userDocSnap = await getDoc(userDocRef);
        }

        if (userDocSnap.exists()) {
          // Cast to UserWithAssetAccess to ensure fileAccesses and projectAssignments properties are available
          const currentFileData = userDocSnap.data() as UserWithAssetAccess;

          // --- Handle fileAccesses update ---
          const existingFileAccesses: UserProjectAssetAccess[] = Array.isArray(
            currentFileData.fileAccesses
          )
            ? currentFileData.fileAccesses
            : [];

          // Filter out old access entries for the current project
          const otherProjectsAccess = existingFileAccesses.filter(
            (access) => access.projectId !== this.selectedProject?.uid
          );

          // Add new/updated access entries for the current project
          const newProjectAccess: UserProjectAssetAccess[] = [];
          if (userAccessMapForProject) { // Only process if userAccessMapForProject exists
            this.selectedProject.assets.forEach((asset) => {
              const hasAccess = userAccessMapForProject.get(asset.key) || false;
              newProjectAccess.push({
                projectId: this.selectedProject!.uid, // Explicitly set the projectId
                assetKey: asset.key,
                hasAccess: hasAccess,
              });
            });
          }

          // Combine and filter out `hasAccess: false` entries if you only want to store `true` access
          const combinedFileAccesses = [
            ...otherProjectsAccess,
            ...newProjectAccess,
          ].filter((access) => access.hasAccess);
          console.log(
            `User ${user.email} - Combined File Accesses to save:`,
            combinedFileAccesses
          );

          // --- Handle projectAssignments update ---
          const existingProjectAssignments: UserProjectAssignment[] = Array.isArray(
            currentFileData.projectAssignments
          )
            ? currentFileData.projectAssignments
            : [];

          // Filter out old assignment entries for the current project
          const otherProjectsAssignments = existingProjectAssignments.filter(
            (assignment) => assignment.projectId !== this.selectedProject?.uid
          );

          let updatedProjectAssignments: UserProjectAssignment[] = [...otherProjectsAssignments];

          // If the user is currently assigned to the selected project, add its assignment
          const isUserAssigned = this.tempSelectedProjectUsers.some(u => u.uid === user.uid);
          if (isUserAssigned) {
            // Add a new project assignment entry with an empty taskIds array
            // This component only handles project assignment, not specific task assignments within it.
            updatedProjectAssignments.push({
              projectId: this.selectedProject!.uid,
              taskIds: []
            });
          }
          console.log(
            `User ${user.email} - Updated Project Assignments to save:`,
            updatedProjectAssignments
          );


          // Perform the update for both fileAccesses and projectAssignments
          await updateDoc(userDocRef, {
            fileAccesses: combinedFileAccesses,
            projectAssignments: updatedProjectAssignments // Save the updated project assignments
          });
          console.log(
            `Updated asset access and project assignments for user ${user.email} in project ${this.selectedProject.name}`
          );

          // Update the local allDomainUsersWithAccess to reflect the saved changes
          const userIndex = this.allDomainUsersWithAccess.findIndex(
            (u) => u.uid === user.uid
          );
          if (userIndex > -1) {
            this.allDomainUsersWithAccess[userIndex].fileAccesses = combinedFileAccesses;
            this.allDomainUsersWithAccess[userIndex].projectAssignments = updatedProjectAssignments;
          }

          // Audit logging for individual user asset access update
          if (this.adminUid) {
            logAuditActionWithSetDoc(
              this.firestore,
              this.adminUid,
              'user_asset_access_update',
              `${user.uid}_${this.selectedProject.uid}`, // Resource ID: userId_projectId
              'success'
            );
          }
        } else {
          console.warn(
            `User document not found for UID: ${user.uid}. Cannot update asset access or project assignments.`
          );
          this.showTemporaryMessage(
            `User ${user.email} not found. Asset access/project assignments not saved.`,
            true
          );
        }
      }

      // Refresh the main projects list to ensure the updated project data is visible
      // Re-fetch projects and then re-select the project to ensure userAssetAccessState is fresh
      await this.fetchProjects();
      if (this.selectedProject) {
        // Find the updated project in the newly fetched list
        const updatedSelectedProject = this.projectsList.find(
          (p) => p.uid === this.selectedProject?.uid
        );
        if (updatedSelectedProject) {
          // Re-select the project to trigger re-loading of userAssetAccessState
          this.selectProject(updatedSelectedProject);
        } else {
          // If the selected project was somehow deleted or not found after re-fetch
          this.selectedProject = null;
          this.userAssetAccessState.clear();
          this.tempSelectedProjectUsers = [];
          this.expandedUserAssetAccess.clear();
        }
      }


      // Audit logging for overall project user assignment
      if (this.adminUid && this.selectedProject?.uid) {
        logAuditActionWithSetDoc(
          this.firestore,
          this.adminUid,
          'project_users_assignment_complete',
          this.selectedProject.uid,
          'success'
        );
      } else {
        console.warn('Admin UID or Project ID not found for audit logging.');
      }

      this.showTemporaryMessage(
        'Project and user asset assignments updated successfully!'
      );
    } catch (error: any) {
      console.error('Error saving project and user asset assignments:', error);
      this.showTemporaryMessage(
        `Failed to save assignments: ${
          error.message || 'An unknown error occurred.'
        }`,
        true
      );
      if (this.adminUid && this.selectedProject?.uid) {
        logAuditActionWithSetDoc(
          this.firestore,
          this.adminUid,
          'project_users_assignment_complete',
          this.selectedProject.uid,
          'failed'
        );
      }
    }
  }
}
