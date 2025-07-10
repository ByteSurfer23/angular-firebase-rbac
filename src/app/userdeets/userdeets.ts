// src/app/user-lookup/user-lookup.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from '@angular/fire/firestore';
import { AssignedUser, ProjectDocument, ProjectTask } from '../models/models';

@Component({
  selector: 'app-user-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  template: `
    <div class="min-h-screen bg-gray-50 text-gray-800 font-poppins p-4 sm:p-6 rounded-xl overflow-hidden">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }

        /* Custom Scrollbar for light theme */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #e5e7eb; /* gray-200 */
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #9ca3af; /* gray-400 */
            border-radius: 4px;
            border: 2px solid #e5e7eb; /* gray-200 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280; /* gray-500 */
        }

        /* Subtle glow for focus */
        .input-focus-glow:focus {
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5); /* Blue glow */
            outline: none;
        }

        /* Card Entry Animation */
        @keyframes slide-in-fade {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-fade {
            animation: slide-in-fade 0.6s ease-out forwards;
        }

        /* --- CUSTOM GRADIENT STYLES (Yellow & Hot Pink) --- */
        .text-custom-gradient {
            background: linear-gradient(to right, #FFEA00, #FF1493); /* Bright Yellow to Hot Pink */
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
            display: inline-block;
        }

        .bg-custom-gradient {
            background: linear-gradient(to right, #FFEA00, #FF1493); /* Bright Yellow to Hot Pink */
        }
      </style>

      <div *ngIf="message" class="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-4 shadow-md">
        <span class="block sm:inline font-medium">{{ message }}</span>
        <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-green-600 hover:text-green-800" (click)="message = ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </button>
      </div>

      <div *ngIf="errorMessage" class="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-4 shadow-md">
        <span class="block sm:inline font-medium">{{ errorMessage }}</span>
        <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-red-600 hover:text-red-800" (click)="errorMessage = ''">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        </button>
      </div>

      <main class=" rounded-xl shadow-lg space-y-10">
        <!-- General Loader for main operations -->
        <div *ngIf="loading && !selectedUserForAnalytics" class="flex justify-center items-center py-8">
          <div class="loader-spinner mr-3"></div>
          <span class="text-gray-600 font-medium">Loading data...</span>
        </div>

        <section *ngIf="userRole === 'root' && !loading" class="animate-slide-in-fade p-6 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-inner space-y-6">
          <h3 class="text-2xl font-bold text-custom-gradient text-center">Root User: Search User by UID in any Domain</h3>
          <div>
            <label for="searchDomainUid" class="block text-gray-700 text-sm font-medium mb-2">Domain ID:</label>
            <input type="text" id="searchDomainUid" [(ngModel)]="searchDomainUid" name="searchDomainUid" placeholder="Enter Domain UID (e.g., domain123)" required
                   class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 input-focus-glow transition duration-250 ease-in-out" />
          </div>
          <div>
            <label for="searchUserUid" class="block text-gray-700 text-sm font-medium mb-2">User UID:</label>
            <input type="text" id="searchUserUid" [(ngModel)]="searchUserUid" name="searchUserUid" placeholder="Enter User UID (e.g., user456)" required
                   class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 input-focus-glow transition duration-250 ease-in-out" />
          </div>
          <button (click)="searchUserByUid()" [disabled]="loading"
                  class="w-full bg-custom-gradient text-white font-semibold py-3 px-6 rounded-lg border-2 border-gray-300
                         hover:opacity-90 active:opacity-100 transition duration-300 ease-in-out transform hover:-translate-y-0.5
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
            <span *ngIf="!loading">Search User</span>
            <span *ngIf="loading" class="flex items-center space-x-2">
              <div class="loader-spinner"></div>
              <span>Searching...</span>
            </span>
          </button>

          <div *ngIf="foundUser" class="mt-6 p-6 bg-white rounded-lg border-2 border-gray-300 shadow-md animate-slide-in-fade">
            <h4 class="text-xl font-bold text-green-600 mb-3">User Details:</h4>
            <p class="text-gray-700 mb-1"><strong>UID:</strong> <span class="break-all font-mono text-gray-800">{{ foundUser.uid }}</span></p>
            <p class="text-gray-700"><strong>Email:</strong> <span class="break-all font-mono text-gray-800">{{ foundUser.email }}</span></p>
            <button (click)="selectUserForAnalytics(foundUser, true)"
                    class="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
              Show User Analytics
            </button>
          </div>
          <p *ngIf="searchAttempted && !foundUser && !loading" class="mt-4 text-red-600 text-center font-medium">User not found in the specified domain.</p>
        </section>

        <section *ngIf="(userRole === 'admin' || userRole === 'user') && !loading" class="animate-slide-in-fade p-6 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-inner space-y-6">
          <h3 class="text-2xl font-bold text-custom-gradient text-center">All Users in Your Domain</h3>
          <div>
            <input
              type="text"
              placeholder="Filter users by email..."
              [(ngModel)]="filterTermUsers"
              name="filterTermUsers"
              class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 input-focus-glow transition duration-250 ease-in-out"
            />
          </div>
          <div class="overflow-y-auto max-h-96 custom-scrollbar rounded-lg border-2 border-gray-300 shadow-md">
            <table class="min-w-full bg-white rounded-lg overflow-hidden">
              <thead>
                <tr class="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th class="py-3 px-6 text-left">User Email</th>
                  <th class="py-3 px-6 text-left">UID</th>
                  <th class="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="text-gray-800 text-sm font-light">
                <tr *ngFor="let user of filteredDomainUsers"
                    [class.cursor-pointer]="true"
                    [class.bg-blue-50]="selectedUserForAnalytics?.uid === user.uid"
                    class="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out">
                  <td class="py-3 px-6 text-left break-all">{{ user.email }}</td>
                  <td class="py-3 px-6 text-left break-all font-mono">{{ user.uid }}</td>
                  <td class="py-3 px-6 text-center">
                    <button (click)="selectUserForAnalytics(user); $event.stopPropagation()"
                            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm transition duration-300 ease-in-out transform hover:scale-105">
                      View Analytics
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredDomainUsers.length === 0">
                  <td colspan="3" class="py-4 text-center text-gray-500">No users found in this domain.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section *ngIf="selectedUserForAnalytics" class="mt-8 bg-gray-100 p-8 rounded-xl shadow-lg border-2 border-gray-300 animate-slide-in-fade">
          <h3 class="text-3xl font-bold text-custom-gradient mb-6 text-center">Analytics for {{ selectedUserForAnalytics.email }}</h3>
          <button (click)="selectedUserForAnalytics = null; resetAnalyticsData();"
                  class="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-lg mb-6 float-right
                         transition duration-300 ease-in-out transform hover:scale-105">
            Hide Analytics
          </button>
          <div class="clear-both"></div>

          <div *ngIf="analyticsDataAvailable" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <div class="bg-white p-6 rounded-lg shadow-md text-center border-2 border-gray-200 transition duration-300 ease-in-out transform hover:-translate-y-0.5">
              <h4 class="text-xl font-semibold text-blue-600 mb-3">Projects & Tasks Assigned</h4>
              <p class="text-5xl font-extrabold text-custom-gradient">{{ projectsAssignedCount }}</p>
              <p class="text-gray-600 mt-1">Projects Assigned</p>
              <p class="text-5xl font-extrabold text-custom-gradient mt-4">{{ tasksAssignedCount }}</p>
              <p class="text-gray-600 mt-1">Tasks Assigned</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 transition duration-300 ease-in-out transform hover:-translate-y-0.5">
              <h4 class="text-xl font-semibold text-blue-600 mb-3 text-center">Task Status Breakdown</h4>
              <div class="space-y-3 mt-4 text-lg">
                <div class="flex justify-between items-center text-green-700 font-medium">
                  <span>Completed:</span>
                  <span class="font-bold">{{ completedTasksCount }} ({{ taskCompletionPercentage | number:'1.0-0' }}%)</span>
                </div>
                <div class="flex justify-between items-center text-yellow-700 font-medium">
                  <span>In Progress:</span>
                  <span class="font-bold">{{ inProgressTasksCount }}</span>
                </div>
                <div class="flex justify-between items-center text-gray-700 font-medium">
                  <span>Not Yet Started:</span>
                  <span class="font-bold">{{ notYetStartedTasksCount }}</span>
                </div>
              </div>
              <div class="h-5 w-full bg-gray-300 rounded-full mt-6 overflow-hidden shadow-inner">
                <div [style.width]="taskCompletionPercentage + '%'" class="h-full bg-green-500 rounded-full transition-all duration-500 ease-in-out"></div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 lg:col-span-1 md:col-span-2 transition duration-300 ease-in-out transform hover:-translate-y-0.5">
              <h4 class="text-xl font-semibold text-blue-600 mb-3 text-center">Monthly Task Completion (Last 12 Months)</h4>
              <div *ngIf="monthlyCompletionData.length > 0; else noMonthlyData" class="overflow-y-auto max-h-48 custom-scrollbar mt-4">
                <ul class="list-none p-0 m-0">
                  <li *ngFor="let item of monthlyCompletionData" class="flex justify-between items-center border-b border-gray-200 py-2 text-gray-700">
                    <span class="font-medium">{{ item.monthYearLabel }}:</span>
                    <span class="font-bold text-gray-800">{{ item.count }} tasks</span>
                  </li>
                </ul>
              </div>
              <ng-template #noMonthlyData>
                <p class="text-center text-gray-500 mt-4">No completed tasks in the last 12 months.</p>
              </ng-template>
            </div>
          </div>
          <div *ngIf="!analyticsDataAvailable && !loading" class="text-center text-gray-600 mt-6 font-medium">
            No analytics data available for this user.
          </div>
          <div *ngIf="loading" class="flex justify-center items-center mt-6">
            <div class="loader-spinner mr-3"></div>
            <span class="text-gray-600">Loading analytics...</span>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class UserLookupComponent implements OnInit {
  // Properties read from localStorage
  orgId: string | null = null;
  userRole: string | null = null;
  domainUid: string | null = null; // Only relevant for admin/user roles directly

  // Root-specific search inputs
  searchDomainUid: string = '';
  searchUserUid: string = '';
  foundUser: AssignedUser | null = null;
  searchAttempted: boolean = false; // To show "not found" message only after a search

  // Admin/Regular user specific lists
  allDomainUsers: AssignedUser[] = [];
  filterTermUsers: string = '';

  // Analytics properties
  selectedUserForAnalytics: AssignedUser | null = null;
  analyticsDataAvailable: boolean = false;
  loading: boolean = false; // Added loading state for analytics

  projectsAssignedCount: number = 0;
  tasksAssignedCount: number = 0;
  completedTasksCount: number = 0;
  inProgressTasksCount: number = 0;
  notYetStartedTasksCount: number = 0;
  taskCompletionPercentage: number = 0;
  monthlyCompletionData: { monthYear: string, monthYearLabel: string, count: number }[] = [];

  message: string = '';
  errorMessage: string = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.orgId = localStorage.getItem('orgId');
    this.userRole = localStorage.getItem('userRole');
    this.domainUid = localStorage.getItem('domainUid');

    if (!this.orgId) {
      this.showTemporaryMessage('Error: Organization ID missing from local storage. Cannot fetch user data.', true);
    }
    if (!this.userRole) {
      this.showTemporaryMessage('Error: User role missing from local storage. Functionality may be limited.', true);
    }

    if (this.userRole === 'admin' || this.userRole === 'user') {
      this.fetchAllUsersInDomain();
    }
  }

  // --- Utility Methods ---
  showTemporaryMessage(msg: string, isError: boolean = false) {
    if (isError) {
      this.errorMessage = msg;
      this.message = ''; // Clear success message if error occurs
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    } else {
      this.message = msg;
      this.errorMessage = ''; // Clear error message if success occurs
      setTimeout(() => { this.message = ''; }, 5000);
    }
  }

  // --- Reset Analytics Data ---
  resetAnalyticsData(): void {
    this.projectsAssignedCount = 0;
    this.tasksAssignedCount = 0;
    this.completedTasksCount = 0;
    this.inProgressTasksCount = 0;
    this.notYetStartedTasksCount = 0;
    this.taskCompletionPercentage = 0;
    this.monthlyCompletionData = [];
    this.analyticsDataAvailable = false;
  }

  // --- Root User Specific Methods ---
  async searchUserByUid(): Promise<void> {
    this.foundUser = null;
    this.searchAttempted = true;
    this.errorMessage = '';
    this.message = '';
    this.selectedUserForAnalytics = null; // Clear previous selection
    this.resetAnalyticsData(); // Clear analytics display

    if (!this.orgId) {
      this.showTemporaryMessage('Organization ID is missing. Cannot perform search.', true);
      return;
    }
    if (!this.searchDomainUid) {
      this.showTemporaryMessage('Please enter a Domain ID to search.', true);
      return;
    }
    if (!this.searchUserUid) {
      this.showTemporaryMessage('Please enter a User UID to search.', true);
      return;
    }

    this.loading = true; // Start loading for search
    try {
      let userFound: AssignedUser | null = null;

      // Try fetching from 'users' collection first
      const userDocRef = doc(this.firestore, `organizations/${this.orgId}/domain/${this.searchDomainUid}/users`, this.searchUserUid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        userFound = { uid: userSnap.id, email: userSnap.data()['email'] as string };
      } else {
        // If not found in 'users', try fetching from 'admins' collection
        const adminDocRef = doc(this.firestore, `organizations/${this.orgId}/domain/${this.searchDomainUid}/admins`, this.searchUserUid);
        const adminSnap = await getDoc(adminDocRef);
        if (adminSnap.exists()) {
          userFound = { uid: adminSnap.id, email: adminSnap.data()['email'] as string };
        }
      }

      this.foundUser = userFound;
      if (this.foundUser) {
        this.showTemporaryMessage('User found successfully!');
      } else {
        this.showTemporaryMessage('User not found in the specified domain.', true);
      }

    } catch (error: any) {
      console.error('Error searching user by UID:', error);
      this.showTemporaryMessage(`Failed to search user: ${error.message || 'An unknown error occurred.'}`, true);
    } finally {
      this.loading = false; // End loading for search
    }
  }

  // --- Admin/Regular User Specific Methods ---
  async fetchAllUsersInDomain(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.allDomainUsers = [];
      this.showTemporaryMessage('Organization ID or Domain ID missing. Cannot list users.', true);
      return;
    }

    this.loading = true; // Start loading for fetching all users
    try {
      const usersCollectionRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/users`);
      const usersSnapshot = await getDocs(usersCollectionRef);
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, email: doc.data()['email'] as string }));

      const adminsCollectionRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/admins`);
      const adminsSnapshot = await getDocs(adminsCollectionRef);
      const admins = adminsSnapshot.docs.map(doc => ({ uid: doc.id, email: doc.data()['email'] as string }));

      const combinedUsersMap = new Map<string, AssignedUser>();
      [...users, ...admins].forEach(user => {
        combinedUsersMap.set(user.uid, user);
      });
      this.allDomainUsers = Array.from(combinedUsersMap.values());
    } catch (error: any) {
      console.error('Error fetching all users in domain:', error);
      this.showTemporaryMessage(`Failed to load domain users: ${error.message || 'An unknown error occurred.'}`, true);
    } finally {
      this.loading = false; // End loading for fetching all users
    }
  }

  get filteredDomainUsers(): AssignedUser[] {
    if (!this.filterTermUsers) {
      return this.allDomainUsers;
    }
    const lowerCaseFilterTerm = this.filterTermUsers.toLowerCase();
    return this.allDomainUsers.filter(user =>
      user.email.toLowerCase().includes(lowerCaseFilterTerm)
    );
  }

  // --- Analytics Logic ---
  async selectUserForAnalytics(user: AssignedUser, isRootSearch: boolean = false): Promise<void> {
    this.selectedUserForAnalytics = user;
    this.resetAnalyticsData(); // Reset previous analytics data
    this.errorMessage = '';
    this.message = '';

    const targetOrgId = this.orgId;
    // For Root, use the domain entered in the search; for Admin/User, use their own domain.
    const targetDomainUid = isRootSearch ? this.searchDomainUid : this.domainUid;

    if (!targetOrgId || !targetDomainUid || !user.uid) {
      this.showTemporaryMessage('Missing organization, domain, or user ID to fetch analytics data.', true);
      return;
    }

    this.loading = true; // Start loading for analytics
    this.showTemporaryMessage(`Fetching analytics for ${user.email}...`);

    try {
      let projectsAssignedCount = 0;
      let totalTasksAssigned = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let notYetStartedTasks = 0;
      const monthlyCompletionCounts: { [key: string]: number } = {}; // 'YYYY-MM': count

      const projectsCollectionRef = collection(this.firestore, `organizations/${targetOrgId}/domain/${targetDomainUid}/projects`);

      // Query projects where 'usersWorkingOnProject' array contains the user's UID and email object.
      // IMPORTANT: This query requires the exact object { uid: user.uid, email: user.email }
      // to be present in the 'usersWorkingOnProject' array. If you only store UIDs, or
      // if the AssignedUser object has more fields, this query will not work.
      // In that case, you might need to query all projects and filter client-side,
      // or adjust the query based on your actual data structure (e.g., array-contains just the UID).
      const q = query(projectsCollectionRef, where('usersWorkingOnProject', 'array-contains', { uid: user.uid, email: user.email }));

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(projectDoc => {
        const projectData = projectDoc.data() as ProjectDocument;
        projectsAssignedCount++;

        // Iterate through tasks within this project's tasks array
        projectData.tasks.forEach(task => {
          // Check if this task is assigned to the current user
          const isTaskAssignedToUser = task.assignedTo.some(assignee => assignee.uid === user.uid);

          if (isTaskAssignedToUser) {
            totalTasksAssigned++;
            if (task.status === 'completed') {
              completedTasks++;
            } else if (task.status === 'in progress') {
              inProgressTasks++;
            } else if (task.status === 'not yet started') {
              notYetStartedTasks++;
            }

            // For Monthly Task Completion
            // Ensure task.createdAt is a Timestamp and convert to Date
            if (task.status === 'completed' && task.createdAt instanceof Timestamp) {
              const date = task.createdAt.toDate();
              const year = date.getFullYear();
              const month = date.getMonth(); // 0-11
              const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
              monthlyCompletionCounts[monthKey] = (monthlyCompletionCounts[monthKey] || 0) + 1;
            }
          }
        });
      });

      this.projectsAssignedCount = projectsAssignedCount;
      this.tasksAssignedCount = totalTasksAssigned;
      this.completedTasksCount = completedTasks;
      this.inProgressTasksCount = inProgressTasks;
      this.notYetStartedTasksCount = notYetStartedTasks;
      this.taskCompletionPercentage = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;

      // Prepare monthly completion data for the last 12 months
      const currentMonth = new Date();
      const tempMonthlyData: { monthYear: string, monthYearLabel: string, count: number }[] = [];
      for (let i = 11; i >= 0; i--) { // Last 12 months, including current
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' }); // Changed to 'numeric' for full year
        tempMonthlyData.push({
            monthYear: monthKey,
            monthYearLabel: monthLabel,
            count: monthlyCompletionCounts[monthKey] || 0
        });
      }
      // Filter to only show months with completed tasks, or show all if no tasks completed
      this.monthlyCompletionData = tempMonthlyData.filter(item => item.count > 0);
      if (this.monthlyCompletionData.length === 0 && totalTasksAssigned > 0) {
        // If there are tasks but none completed in the last 12 months, show all months with 0
        this.monthlyCompletionData = tempMonthlyData;
      }


      this.analyticsDataAvailable = true;
      if (projectsAssignedCount === 0 && totalTasksAssigned === 0) {
        this.showTemporaryMessage(`No project or task data found for ${user.email}.`, false);
      } else {
        this.showTemporaryMessage(`Analytics loaded for ${user.email}.`);
      }

    } catch (error: any) {
      console.error('Error fetching user analytics data:', error);
      this.showTemporaryMessage(`Failed to load analytics for user: ${error.message || 'An unknown error occurred.'}`, true);
      this.analyticsDataAvailable = false;
    } finally {
      this.loading = false; // End loading for analytics
    }
  }
}
