// src/app/user-dashboard/user-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common'; // Import pipes for template
import {
  Firestore,
  doc,
  getDoc,
  updateDoc, // Import updateDoc for task status updates
  Timestamp // Import Timestamp for task due dates
} from '@angular/fire/firestore';
import {
  UserWithAssetAccess,
  ProjectDocument,
  UserProjectAssetAccess,
  AssignedUser,
  ProjectTask,
  UserProjectAssignment
} from '../models/models';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Import audit log function

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe], // Add DatePipe and TitleCasePipe
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
            border-radius: 44px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4b5563; /* gray-600 */
            border-radius: 4px;
            border: 2px solid #1f2937; /* gray-800 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280; /* gray-500 */
        }
        /* Tab styling */
        .tab-button {
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem 0.5rem 0 0;
          background-color: #1f2937; /* gray-800 */
          color: #9ca3af; /* gray-400 */
          font-weight: 600;
          transition: all 0.2s ease-in-out;
          border-bottom: 2px solid transparent;
          cursor: pointer; /* Indicate clickable */
        }
        .tab-button.active {
          background-color: #374151; /* gray-700 */
          color: #e5e7eb; /* gray-100 */
          border-color: #6366f1; /* indigo-500 */
        }
        .tab-button:hover:not(.active) {
          background-color: #374151; /* gray-700 */
          color: #e5e7eb; /* gray-100 */
        }
        .tab-content {
          background-color: #374151; /* gray-700 */
          border-radius: 0 0.5rem 0.5rem 0.5rem;
          padding: 1.5rem;
          min-height: 200px;
        }
      </style>

      <header class="bg-gray-800 p-4 rounded-xl shadow-lg mb-6 text-center">
        <h1 class="text-3xl font-bold text-blue-400 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-8 w-8 text-green-300">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          User Dashboard
        </h1>
        <p class="text-sm text-gray-400 mt-2">
          Welcome, <span class="font-semibold text-blue-300">{{ currentUser?.email || 'User' }}</span>!
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Org: {{ orgId || 'N/A' }} | Domain: {{ domainUid || 'N/A' }} | UID: {{ uid || 'N/A' }}
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

      <div *ngIf="loading" class="text-blue-400 text-center text-lg mb-4">Loading user data...</div>
      <div *ngIf="!loading && !currentUser && !errorMessage" class="text-yellow-400 text-center text-lg mb-4">
        User data not found or not logged in. Please ensure you are logged in.
      </div>

      <main *ngIf="currentUser && !loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- My Accessible Files Section -->
        <section class="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 class="text-2xl font-bold text-blue-300 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-6 w-6">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="10" y2="9"/>
            </svg>
            My Accessible Files (for selected project)
          </h2>
          <div *ngIf="filteredAccessibleFiles.length > 0" class="overflow-y-auto max-h-60 custom-scrollbar">
            <ul class="space-y-3">
              <li *ngFor="let file of filteredAccessibleFiles" class="bg-gray-700 p-3 rounded-md flex items-center justify-between">
                <span class="font-medium text-gray-200">{{ file.assetKey }}</span>
                <a [href]="file.url" target="_blank" class="text-blue-400 hover:underline flex items-center text-sm">
                  Access File
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1 h-4 w-4">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <p *ngIf="filteredAccessibleFiles.length === 0" class="text-gray-500 text-center py-4">
            No files currently accessible to you for the selected project.
          </p>
        </section>

        <!-- My Projects & Tasks Section -->
        <section class="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
          <h2 class="text-2xl font-bold text-blue-300 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-6 w-6">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 19V3"/><path d="M6 8h12"/>
            </svg>
            My Projects & Tasks
          </h2>

          <div *ngIf="userProjects.length > 0; else noProjects">
            <!-- Project Tabs -->
            <div class="flex flex-wrap border-b border-gray-700 mb-4 -mx-2">
              <button
                *ngFor="let project of userProjects"
                (click)="selectProject(project.uid)"
                [class.active]="selectedProjectForTasks?.uid === project.uid"
                class="tab-button mx-2 mb-2"
              >
                {{ project.name }}
              </button>
            </div>

            <!-- Task List for Selected Project -->
            <div *ngIf="selectedProjectForTasks" class="tab-content custom-scrollbar overflow-y-auto max-h-80">
              <h3 class="text-xl font-semibold text-green-300 mb-4">
                Tasks for {{ selectedProjectForTasks.name }}
              </h3>
              <div *ngIf="selectedProjectForTasks.tasks.length > 0; else noTasks">
                <ul class="space-y-4">
                  <li *ngFor="let task of selectedProjectForTasks.tasks" class="bg-gray-800 p-4 rounded-md shadow-md">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-lg font-bold text-blue-200">{{ task.description }}</span>
                      <div class="flex items-center space-x-2">
                        <select
                          [ngModel]="getTempTaskStatus(task.id)"
                          (ngModelChange)="onTaskStatusChange(task.id, $event)"
                          class="bg-gray-700 text-white p-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="not yet started">Not Yet Started</option>
                          <option value="in progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          *ngIf="hasPendingStatusChange(task.id, task.status)"
                          (click)="updateTaskStatus(selectedProjectForTasks.uid!, task.id, getTempTaskStatus(task.id))"
                          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200 ease-in-out transform hover:scale-105"
                          [disabled]="!hasPendingStatusChange(task.id, task.status)"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                    <p class="text-gray-400 text-sm mb-2">Due: {{ task.dueDate.toDate() | date:'mediumDate' }}</p>
                    <p *ngIf="task.assignedTo && task.assignedTo.length > 0" class="text-gray-400 text-xs">
                      Assigned To: {{ getAssignedToEmails(task.assignedTo) }}
                    </p>
                    <p *ngIf="!task.assignedTo || task.assignedTo.length === 0" class="text-gray-500 text-xs">
                      No one assigned.
                    </p>
                  </li>
                </ul>
              </div>
              <ng-template #noTasks>
                <p class="text-gray-500 text-center py-4">No tasks found for this project.</p>
              </ng-template>
            </div>
          </div>
          <ng-template #noProjects>
            <p class="text-gray-500 text-center py-4">You are not assigned to any projects yet.</p>
          </ng-template>
        </section>
      </main>
    </div>
  `,
})
export class UserDashboardComponent implements OnInit {
  orgId: string | null = null;
  domainUid: string | null = null;
  uid: string | null = null;

  currentUser: UserWithAssetAccess | null = null;
  loading: boolean = true;
  message: string = '';
  errorMessage: string = '';

  // Stores ALL files the user has access to, regardless of current project selection
  private allAccessibleFiles: { assetKey: string; url: string; projectId: string }[] = [];
  // Stores files filtered by the currently selected project
  filteredAccessibleFiles: { assetKey: string; url: string }[] = [];

  // Stores the full ProjectDocument for projects the user is assigned to
  userProjects: ProjectDocument[] = [];
  // The currently selected project whose tasks are displayed
  selectedProjectForTasks: ProjectDocument | null = null;

  // Map to cache fetched project documents by ID to avoid redundant Firestore reads
  private projectsMap: Map<string, ProjectDocument> = new Map();

  // NEW: Map to store pending status changes for tasks (taskId -> newStatus)
  private pendingTaskStatusChanges: Map<string, ProjectTask['status']> = new Map();

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    // Retrieve user identification details from local storage
    this.orgId = localStorage.getItem('orgId');
    this.domainUid = localStorage.getItem('domainUid');
    this.uid = localStorage.getItem('uid'); // Current user's UID

    // Validate essential IDs
    if (!this.orgId || !this.domainUid || !this.uid) {
      this.showTemporaryMessage('Error: Organization ID, Domain ID, or User UID missing from local storage. Please log in.', true);
      this.loading = false; // Stop loading if essential data is missing
      return;
    }

    // Initiate data fetching for the dashboard
    this.fetchUserDataAndProjects();
  }

  /**
   * Displays a temporary message to the user, either success or error.
   * @param msg The message to display.
   * @param isError True if it's an error message, false otherwise.
   */
  showTemporaryMessage(msg: string, isError: boolean = false) {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => { this.errorMessage = ''; }, 5000); // Clear error message after 5 seconds
    } else {
      this.message = msg;
      setTimeout(() => { this.message = ''; }, 5000); // Clear success message after 5 seconds
    }
  }

  /**
   * Helper method to get a comma-separated string of assigned user emails.
   * @param assignedTo An array of AssignedUser objects.
   * @returns A string of emails or 'N/A' if empty.
   */
  getAssignedToEmails(assignedTo: AssignedUser[] | undefined): string {
    if (!assignedTo || assignedTo.length === 0) {
      return 'N/A';
    }
    return assignedTo.map(u => u.email).join(', ');
  }

  /**
   * Fetches the current user's document and then proceeds to fetch their assigned projects and accessible files.
   */
  async fetchUserDataAndProjects(): Promise<void> {
    this.loading = true; // Set loading state to true
    try {
      // 1. Fetch current user's document from 'users' collection
      let userDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/users/${this.uid!}`);
      let userDocSnap = await getDoc(userDocRef);

      // If not found in 'users', try fetching from 'admins' collection
      if (!userDocSnap.exists()) {
        userDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/admins/${this.uid!}`);
        userDocSnap = await getDoc(userDocRef);
      }

      if (userDocSnap.exists()) {
        // Cast the fetched data to UserWithAssetAccess interface
        this.currentUser = { uid: userDocSnap.id, ...userDocSnap.data() } as UserWithAssetAccess;
        console.log('Fetched Current User:', this.currentUser);

        // 2. Fetch all projects the user is assigned to based on projectAssignments
        await this.fetchUserAssignedProjects();

        // 3. Process and prepare the list of all accessible files
        await this.processAllAccessibleFiles();

        // Automatically select the first project's tasks to display if available
        if (this.userProjects.length > 0) {
          this.selectProject(this.userProjects[0].uid);
        }

      } else {
        // User document not found in either collection
        this.showTemporaryMessage('User document not found. Please ensure your account exists or you are logged in correctly.', true);
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Error fetching user data or projects:', error);
      this.showTemporaryMessage('Failed to load dashboard data. Please try again or contact support.', true);
    } finally {
      this.loading = false; // Set loading state to false once data fetching is complete
    }
  }

  /**
   * Fetches the full ProjectDocument for each project the user is assigned to.
   * Caches project documents to avoid redundant reads.
   */
  async fetchUserAssignedProjects(): Promise<void> {
    if (!this.currentUser || !this.orgId || !this.domainUid) {
      this.userProjects = [];
      return;
    }

    // Get unique project IDs from the user's projectAssignments
    const assignedProjectIds = new Set(this.currentUser.projectAssignments?.map(pa => pa.projectId) || []);
    const fetchedProjects: ProjectDocument[] = [];

    // Iterate through each assigned project ID
    for (const projectId of Array.from(assignedProjectIds)) {
      // Check if the project is already in the cache
      if (this.projectsMap.has(projectId)) {
        fetchedProjects.push(this.projectsMap.get(projectId)!);
        continue; // Skip fetching if already cached
      }

      try {
        // Fetch the project document from Firestore
        const projectDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/projects/${projectId}`);
        const projectDocSnap = await getDoc(projectDocRef);

        if (projectDocSnap.exists()) {
          const projectData = { uid: projectDocSnap.id, ...projectDocSnap.data() } as ProjectDocument;
          fetchedProjects.push(projectData);
          this.projectsMap.set(projectId, projectData); // Cache the fetched project document
        } else {
          console.warn(`Project document not found for ID: ${projectId}. It might have been deleted.`);
        }
      } catch (error) {
        console.error(`Error fetching project ${projectId}:`, error);
      }
    }
    this.userProjects = fetchedProjects; // Update the list of projects for the UI
    console.log('User Assigned Projects:', this.userProjects);
  }

  /**
   * Processes the user's fileAccesses to create a comprehensive list of all accessible files with their URLs.
   * This list is then used to filter based on the selected project.
   */
  async processAllAccessibleFiles(): Promise<void> {
    this.allAccessibleFiles = []; // Clear previous accessible files
    if (!this.currentUser || !this.orgId || !this.domainUid) {
      return;
    }

    const fileAccesses = Array.isArray(this.currentUser.fileAccesses) ? this.currentUser.fileAccesses : [];

    for (const access of fileAccesses) {
      if (access.hasAccess) { // Only consider files where access is granted
        let project: ProjectDocument | undefined;

        // Try to get the project from the cache first
        if (this.projectsMap.has(access.projectId)) {
          project = this.projectsMap.get(access.projectId);
        } else {
          // If not in cache, fetch it from Firestore
          try {
            const projectDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/projects/${access.projectId}`);
            const projectDocSnap = await getDoc(projectDocRef);
            if (projectDocSnap.exists()) {
              project = { uid: projectDocSnap.id, ...projectDocSnap.data() } as ProjectDocument;
              this.projectsMap.set(access.projectId, project); // Add to cache
            }
          } catch (error) {
            console.error(`Error fetching project ${access.projectId} for file access:`, error);
          }
        }

        // If the project was found, find the specific asset and add it to allAccessibleFiles
        if (project) {
          const asset = project.assets.find(a => a.key === access.assetKey);
          if (asset) {
            this.allAccessibleFiles.push({
              projectId: access.projectId, // Store projectId for filtering
              assetKey: asset.key,
              url: asset.url
            });
          } else {
            console.warn(`Asset '${access.assetKey}' not found in project '${project.name}' (${project.uid}). It might have been removed.`);
          }
        }
      }
    }
    console.log('All Accessible Files:', this.allAccessibleFiles);
    // Initial filtering based on the first selected project (if any)
    if (this.selectedProjectForTasks) {
      this.filterAccessibleFilesForSelectedProject(this.selectedProjectForTasks.uid);
    }
  }

  /**
   * Filters the `allAccessibleFiles` based on the provided `projectId`
   * and updates `filteredAccessibleFiles` for display.
   */
  filterAccessibleFilesForSelectedProject(projectId: string): void {
    this.filteredAccessibleFiles = this.allAccessibleFiles.filter(
      file => file.projectId === projectId
    );
    console.log(`Filtered Accessible Files for project ${projectId}:`, this.filteredAccessibleFiles);
  }

  /**
   * Sets the currently selected project for task display and updates accessible files.
   * @param projectId The UID of the project to select.
   */
  selectProject(projectId: string): void {
    this.selectedProjectForTasks = this.userProjects.find(p => p.uid === projectId) || null;
    if (this.selectedProjectForTasks) {
      this.showTemporaryMessage(`Viewing tasks for project: ${this.selectedProjectForTasks.name}`);
      // NEW: Filter accessible files for the newly selected project
      this.filterAccessibleFilesForSelectedProject(projectId);
      // Clear any pending changes when switching projects
      this.pendingTaskStatusChanges.clear();
    } else {
      this.showTemporaryMessage('Project not found or no tasks to display.', true);
      this.filteredAccessibleFiles = []; // Clear files if no project is selected or found
      this.pendingTaskStatusChanges.clear(); // Clear pending changes
    }
  }

  // NEW: Handles change in select dropdown, updates temporary state
  onTaskStatusChange(taskId: string, newStatus: ProjectTask['status']): void {
    this.pendingTaskStatusChanges.set(taskId, newStatus);
    console.log(`Pending status for task ${taskId}: ${newStatus}`);
  }

  // NEW: Gets the temporary status for a task, or its current status if no pending change
  getTempTaskStatus(taskId: string): ProjectTask['status'] {
    return this.pendingTaskStatusChanges.get(taskId) ||
           this.selectedProjectForTasks?.tasks.find(t => t.id === taskId)?.status ||
           'not yet started'; // Fallback
  }

  // NEW: Checks if there is a pending status change for a task
  hasPendingStatusChange(taskId: string, currentStatus: ProjectTask['status']): boolean {
    const pendingStatus = this.pendingTaskStatusChanges.get(taskId);
    return pendingStatus !== undefined && pendingStatus !== currentStatus;
  }

  /**
   * Updates the status of a specific task in Firestore and logs the action.
   * @param projectId The UID of the project the task belongs to.
   * @param taskId The UID of the task to update.
   * @param newStatus The new status for the task.
   */
  async updateTaskStatus(projectId: string, taskId: string, newStatus: ProjectTask['status']): Promise<void> {
    if (!this.orgId || !this.domainUid || !this.uid) {
      this.showTemporaryMessage('Missing organization, domain, or user ID for task update.', true);
      return;
    }

    try {
      const projectDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/projects/${projectId}`);
      // Fetch the current project data to get the existing tasks array
      const projectDocSnap = await getDoc(projectDocRef);

      if (projectDocSnap.exists()) {
        const projectData = projectDocSnap.data() as ProjectDocument;
        const updatedTasks = projectData.tasks.map(task => {
          if (task.id === taskId) { // Use task.uid for comparison
            return { ...task, status: newStatus };
          }
          return task;
        });

        // Update the tasks array in Firestore
        await updateDoc(projectDocRef, { tasks: updatedTasks });

        // NEW: Re-fetch the specific project data to ensure full synchronization with DB
        // This is crucial to get the absolute latest state from the database.
        await this.refreshProjectData(projectId);

        // Clear the pending change for this specific task AFTER successful DB update and local refresh
        this.pendingTaskStatusChanges.delete(taskId);

        this.showTemporaryMessage(`Task status updated to '${newStatus}' successfully!`);

        // Audit logging
        logAuditActionWithSetDoc(
          this.firestore,
          this.uid!, // Non-null assertion here
          'task_status_update',
          `${projectId}_${taskId}`, // Resource ID: projectId_taskId
          'success'
        );

      } else {
        this.showTemporaryMessage('Project not found for task update.', true);
        logAuditActionWithSetDoc(
          this.firestore,
          this.uid!, // Non-null assertion here
          'task_status_update',
          `${projectId}_${taskId}`,
          'failed'
        );
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      this.showTemporaryMessage(`Failed to update task status: ${error.message || 'An unknown error occurred.'}`, true);
      logAuditActionWithSetDoc(
        this.firestore,
        this.uid!, // Non-null assertion here
        'task_status_update',
        `${projectId}_${taskId}`,
        `failed`
      );
    }
  }

  /**
   * NEW: Refreshes the data for a specific project from Firestore and updates local state.
   * This ensures the UI is always in sync with the database after an update.
   * @param projectId The UID of the project to refresh.
   */
  async refreshProjectData(projectId: string): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      console.warn('Cannot refresh project data: Missing organization or domain ID.');
      return;
    }
    try {
      const projectDocRef = doc(this.firestore, `organizations/${this.orgId!}/domain/${this.domainUid!}/projects/${projectId}`);
      const projectDocSnap = await getDoc(projectDocRef);

      if (projectDocSnap.exists()) {
        const refreshedProjectData = { uid: projectDocSnap.id, ...projectDocSnap.data() } as ProjectDocument;

        // Update the project in the main userProjects array
        // Use map to create a new array reference for Angular's change detection
        this.userProjects = this.userProjects.map(p =>
          p.uid === projectId ? refreshedProjectData : p
        );

        // Update the selected project if it's the one being viewed
        // Create a new object reference to trigger change detection
        if (this.selectedProjectForTasks?.uid === projectId) {
          this.selectedProjectForTasks = { ...refreshedProjectData };
        }

        // Update the cache
        this.projectsMap.set(projectId, refreshedProjectData);
        console.log(`Project ${projectId} data refreshed from database.`);
      } else {
        console.warn(`Project ${projectId} not found during refresh. It might have been deleted.`);
        // Remove from local lists if it no longer exists in DB
        this.userProjects = this.userProjects.filter(p => p.uid !== projectId);
        if (this.selectedProjectForTasks?.uid === projectId) {
          this.selectedProjectForTasks = null;
          this.filteredAccessibleFiles = [];
        }
        this.projectsMap.delete(projectId);
      }
    } catch (error) {
      console.error(`Error refreshing project ${projectId} data:`, error);
      this.showTemporaryMessage(`Failed to refresh project data for ${projectId}.`, true);
    }
  }


  /**
   * Returns CSS classes based on the task status for styling.
   * @param status The status of the task ('not yet started', 'in progress', 'completed').
   * @returns Tailwind CSS classes.
   */
  getTaskStatusClass(status: string): string {
    switch (status) {
      case 'not yet started':
        return 'bg-gray-500 text-white';
      case 'in progress':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white'; // Default fallback
    }
  }
}
