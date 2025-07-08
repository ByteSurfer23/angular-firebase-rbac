// src/app/user-lookup/user-lookup.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule], // Removed NgChartsModule
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-8 w-8 text-yellow-300">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          User Lookup & Management
        </h1>
        <p class="text-sm text-gray-400 mt-2">
          Your Role: <span class="font-semibold text-blue-300">{{ userRole | titlecase }}</span> |
          Organization: <span class="font-semibold text-blue-300">{{ orgId || 'N/A' }}</span>
        </p>
      </header>

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

      <main class="bg-gray-800 p-6 rounded-xl shadow-lg">
        <section *ngIf="userRole === 'root'">
          <h3 class="text-xl font-bold text-blue-300 mb-4">Root User: Search User by UID in any Domain</h3>
          <div class="space-y-4 mb-6">
            <div>
              <label for="searchDomainUid" class="block text-gray-300 text-sm font-bold mb-2">Domain ID:</label>
              <input type="text" id="searchDomainUid" [(ngModel)]="searchDomainUid" name="searchDomainUid" placeholder="Enter Domain UID" required
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label for="searchUserUid" class="block text-gray-300 text-sm font-bold mb-2">User UID:</label>
              <input type="text" id="searchUserUid" [(ngModel)]="searchUserUid" name="searchUserUid" placeholder="Enter User UID" required
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button (click)="searchUserByUid()"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105">
              Search User
            </button>
          </div>

          <div *ngIf="foundUser" class="mt-6 p-4 bg-gray-700 rounded-md border border-gray-600">
            <h4 class="text-lg font-semibold text-green-300 mb-2">User Details:</h4>
            <p><strong>UID:</strong> <span class="break-all">{{ foundUser.uid }}</span></p>
            <p><strong>Email:</strong> <span class="break-all">{{ foundUser.email }}</span></p>
            <button (click)="selectUserForAnalytics(foundUser, true)"
                    class="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
              Show User Analytics
            </button>
          </div>
          <p *ngIf="searchAttempted && !foundUser" class="mt-4 text-red-400 text-center">User not found in the specified domain.</p>
        </section>

        <section *ngIf="userRole === 'admin' || userRole === 'user'">
          <h3 class="text-xl font-bold text-blue-300 mb-4">All Users in Your Domain</h3>
          <div class="mb-4">
            <input
              type="text"
              placeholder="Filter users by email..."
              [(ngModel)]="filterTermUsers"
              name="filterTermUsers"
              class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="overflow-y-auto max-h-96 custom-scrollbar">
            <table class="min-w-full bg-gray-900 rounded-md overflow-hidden">
              <thead>
                <tr class="bg-gray-700 text-gray-200 uppercase text-sm leading-normal">
                  <th class="py-3 px-6 text-left">User Email</th>
                  <th class="py-3 px-6 text-left">UID</th>
                  <th class="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="text-gray-300 text-sm font-light">
                <tr *ngFor="let user of filteredDomainUsers"
                    [class.cursor-pointer]="true"
                    [class.bg-blue-900]="selectedUserForAnalytics?.uid === user.uid"
                    class="border-b border-gray-700 hover:bg-gray-700 transition duration-150 ease-in-out">
                  <td class="py-3 px-6 text-left break-all">{{ user.email }}</td>
                  <td class="py-3 px-6 text-left break-all">{{ user.uid }}</td>
                  <td class="py-3 px-6 text-center">
                    <button (click)="selectUserForAnalytics(user); $event.stopPropagation()"
                            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm transition">
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

        <section *ngIf="selectedUserForAnalytics" class="mt-8 bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
          <h3 class="text-xl font-bold text-green-300 mb-4 text-center">Analytics for {{ selectedUserForAnalytics.email }}</h3>
          <button (click)="selectedUserForAnalytics = null; resetAnalyticsData();"
                  class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg mb-6 float-right">
            Hide Analytics
          </button>
          <div class="clear-both"></div>

          <div *ngIf="analyticsDataAvailable" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <h4 class="text-lg font-semibold text-blue-300 mb-2">Projects & Tasks Assigned</h4>
              <p class="text-3xl font-bold text-white">{{ projectsAssignedCount }}</p>
              <p class="text-gray-400">Projects Assigned</p>
              <p class="text-3xl font-bold text-white mt-2">{{ tasksAssignedCount }}</p>
              <p class="text-gray-400">Tasks Assigned</p>
            </div>

            <div class="bg-gray-800 p-4 rounded-lg shadow-md">
              <h4 class="text-lg font-semibold text-blue-300 mb-2 text-center">Task Status Breakdown</h4>
              <div class="space-y-2 mt-4">
                <div class="flex justify-between items-center text-green-400">
                  <span>Completed:</span>
                  <span class="font-bold">{{ completedTasksCount }} ({{ taskCompletionPercentage }}%)</span>
                </div>
                <div class="flex justify-between items-center text-yellow-400">
                  <span>In Progress:</span>
                  <span class="font-bold">{{ inProgressTasksCount }}</span>
                </div>
                <div class="flex justify-between items-center text-gray-400">
                  <span>Not Yet Started:</span>
                  <span class="font-bold">{{ notYetStartedTasksCount }}</span>
                </div>
              </div>
              <div class="h-4 w-full bg-gray-600 rounded-full mt-4 overflow-hidden">
                <div [style.width]="taskCompletionPercentage + '%'" class="h-full bg-green-500 rounded-full transition-all duration-500 ease-in-out"></div>
              </div>
            </div>

            <div class="bg-gray-800 p-4 rounded-lg shadow-md lg:col-span-1 md:col-span-2">
              <h4 class="text-lg font-semibold text-blue-300 mb-2 text-center">Monthly Task Completion (Last 12 Months)</h4>
              <div *ngIf="monthlyCompletionData.length > 0; else noMonthlyData" class="overflow-y-auto max-h-48 custom-scrollbar mt-4">
                <ul class="list-none p-0 m-0">
                  <li *ngFor="let item of monthlyCompletionData" class="flex justify-between border-b border-gray-600 py-1.5 text-gray-300">
                    <span>{{ item.monthYearLabel }}:</span>
                    <span class="font-bold text-white">{{ item.count }} tasks</span>
                  </li>
                </ul>
              </div>
              <ng-template #noMonthlyData>
                <p class="text-center text-gray-400 mt-4">No completed tasks in the last 12 months.</p>
              </ng-template>
            </div>
          </div>
          <div *ngIf="!analyticsDataAvailable" class="text-center text-gray-400 mt-4">
            Loading analytics or no data available for this user.
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
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    } else {
      this.message = msg;
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
    }
  }

  // --- Admin/Regular User Specific Methods ---
  async fetchAllUsersInDomain(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.allDomainUsers = [];
      this.showTemporaryMessage('Organization ID or Domain ID missing. Cannot list users.', true);
      return;
    }

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
            if (task.status === 'completed' && task.createdAt) {
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
        const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        tempMonthlyData.push({
            monthYear: monthKey,
            monthYearLabel: monthLabel,
            count: monthlyCompletionCounts[monthKey] || 0
        });
      }
      this.monthlyCompletionData = tempMonthlyData.filter(item => item.count > 0); // Only show months with completed tasks

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
    }
  }
}