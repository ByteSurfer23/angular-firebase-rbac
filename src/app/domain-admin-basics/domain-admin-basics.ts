import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe for displaying dates
import {
  Firestore,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp // Use Timestamp for dates
} from '@angular/fire/firestore';

// Import the interfaces from the new file
import { ProjectAsset, AssignedUser, ProjectTask, ProjectDocument } from '../models/models' // Assuming models.ts is in the same directory or adjust path

// IMPORTANT: Ensure you have this utility function for audit logging.
// If not, remove the import and calls, or create a placeholder.
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Assuming auditlogentry.ts is in the same directory or adjust path


@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe], // Include DatePipe for formatting dates in template
  template: `
    <div class="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-6 rounded-xl overflow-hidden">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      </style>

      <header class="bg-gray-800 p-4 rounded-xl shadow-lg mb-6 text-center">
        <h1 class="text-3xl font-bold text-blue-400 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-8 w-8 text-green-300">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="M15 6 18 9"/>
          </svg>
          Create New Project
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

      <form (ngSubmit)="createProject()" class="bg-gray-800 shadow-md rounded-xl p-6 max-w-2xl mx-auto space-y-6">
        <h3 class="text-2xl font-bold text-center text-blue-300">Project Details</h3>

        <div>
          <label for="projectName" class="block text-gray-300 text-sm font-bold mb-2">Project Name:</label>
          <input type="text" id="projectName" [(ngModel)]="projectName" name="projectName" required
                 class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label for="projectDescription" class="block text-gray-300 text-sm font-bold mb-2">Project Description:</label>
          <textarea id="projectDescription" [(ngModel)]="projectDescription" name="projectDescription" rows="3"
                    class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div class="border border-gray-700 p-4 rounded-md">
          <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-green-300">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Project Assets (Documents/Images)
          </h4>
          <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 mb-4">
            <input type="text" [(ngModel)]="currentAssetKey" name="currentAssetKey" placeholder="Asset Name (e.g., Design Doc)"
                   class="flex-grow p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" [(ngModel)]="currentAssetUrl" name="currentAssetUrl" placeholder="URL to Image/Document"
                   class="flex-grow p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" (click)="addAsset()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 whitespace-nowrap">Add Asset</button>
          </div>
          <ul *ngIf="projectAssets.length > 0" class="list-disc pl-5 space-y-2">
            <li *ngFor="let asset of projectAssets; let i = index" class="p-2 border border-gray-700 rounded-md bg-gray-900 flex items-center justify-between">
              <span class="break-all">{{ asset.key }}: <a [href]="asset.url" target="_blank" class="text-blue-400 hover:underline">{{ asset.url }}</a></span>
              <button type="button" (click)="removeAsset(i)" class="ml-4 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
            </li>
          </ul>
          <p *ngIf="projectAssets.length === 0" class="text-gray-500 text-sm mt-2">No assets added yet.</p>
        </div>

        <div class="border border-gray-700 p-4 rounded-md">
          <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-green-300">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Users Working on this Project
          </h4>
          <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 mb-4">
            <input type="email" [(ngModel)]="currentUserEmailInput" name="currentUserEmailInput" placeholder="User Email (e.g., user@example.com)"
                   class="flex-grow p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" (click)="addUserToProject()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 whitespace-nowrap">Add User</button>
          </div>
          <ul *ngIf="usersWorkingOnProject.length > 0" class="list-disc pl-5 space-y-2">
            <li *ngFor="let user of usersWorkingOnProject; let i = index" class="p-2 border border-gray-700 rounded-md bg-gray-900 flex items-center justify-between">
              <span>{{ user.email }} (UID: {{ user.uid || 'N/A' }})</span>
              <button type="button" (click)="removeUserFromProject(i)" class="ml-4 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
            </li>
          </ul>
          <p *ngIf="usersWorkingOnProject.length === 0" class="text-gray-500 text-sm mt-2">No users added to this project yet.</p>
        </div>

        <div class="border border-gray-700 p-4 rounded-md">
          <h4 class="text-lg font-semibold text-blue-300 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-green-300">
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 12h4"/><path d="M8 18h8"/><path d="M16 6H8c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
            </svg>
            Tasks for this Project
          </h4>
          <div class="space-y-4">
            <div>
              <label for="currentTaskDescription" class="block text-gray-300 text-sm font-bold mb-2">Task Description:</label>
              <input type="text" [(ngModel)]="currentTaskDescription" name="currentTaskDescription" placeholder="Task Description" required
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label for="taskDueDate" class="block text-gray-300 text-sm font-bold mb-2">Due Date:</label>
              <input type="date" id="taskDueDate" [(ngModel)]="currentTaskDueDate" name="currentTaskDueDate" title="Due Date" required
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label for="taskReminderDate" class="block text-gray-300 text-sm font-bold mb-2">Reminder Date (Optional):</label>
              <input type="date" id="taskReminderDate" [(ngModel)]="currentTaskReminderDate" name="currentTaskReminderDate" title="Reminder Date"
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label for="taskStatus" class="block text-gray-300 text-sm font-bold mb-2">Status:</label>
              <select [(ngModel)]="currentTaskStatus" name="currentTaskStatus" required id="taskStatus"
                      class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="not yet started" class="bg-gray-900 text-white">Not Yet Started</option>
                <option value="in progress" class="bg-gray-900 text-white">In Progress</option>
                <option value="completed" class="bg-gray-900 text-white">Completed</option>
              </select>
            </div>
            <div>
              <label for="taskAssignedUserEmailInput" class="block text-gray-300 text-sm font-bold mb-2">Assignee Email(s) (comma-separated):</label>
              <input type="email" [(ngModel)]="currentTaskAssignedUserEmailInput" name="currentTaskAssignedUserEmailInput" placeholder="Assignee Email(s)"
                     class="w-full p-3 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="button" (click)="addTask()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 w-full">Add Task</button>
          </div>
          <ul *ngIf="projectTasks.length > 0" class="list-disc pl-5 mt-4 space-y-2">
            <li *ngFor="let task of projectTasks; let i = index" class="mb-2 p-3 border border-gray-700 rounded-md bg-gray-900">
              <strong>Task:</strong> {{ task.description }}<br>
              <strong>Status:</strong> <span [ngClass]="{'text-yellow-400': task.status === 'in progress', 'text-green-400': task.status === 'completed', 'text-gray-400': task.status === 'not yet started'}">{{ task.status | titlecase }}</span><br>
              <strong>Due:</strong> {{ task.dueDate.toDate() | date:'mediumDate' }}<br>
              
              <strong>Created:</strong> {{ task.createdAt.toDate() | date:'mediumDate' }}<br>
              <strong>Assigned To:</strong> {{ getAssignedEmails(task.assignedTo) }}
              <button type="button" (click)="removeTask(i)" class="ml-2 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
            </li>
          </ul>
          <p *ngIf="projectTasks.length === 0" class="text-gray-500 text-sm mt-2">No tasks added yet.</p>
        </div>

        <button type="submit"
                class="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-bold text-lg transform hover:scale-105">
          Create Project
        </button>
      </form>
    </div>
  `,
})
export class CreateProjectComponent implements OnInit {
  @Input() orgId!: string | null;
  @Input() domainUid!: string | null;

  projectName: string = '';
  projectDescription: string = '';
  message: string = '';
  errorMessage: string = '';

  projectAssets: ProjectAsset[] = [];
  currentAssetKey: string = '';
  currentAssetUrl: string = '';

  usersWorkingOnProject: AssignedUser[] = [];
  currentUserEmailInput: string = '';

  projectTasks: ProjectTask[] = [];
  currentTaskDescription: string = '';
  currentTaskDueDate: string = '';
  currentTaskReminderDate: string = '';
  currentTaskStatus: 'not yet started' | 'in progress' | 'completed' = 'not yet started';
  currentTaskAssignedUserEmailInput: string = '';

  private currentAdminUid: string = '';
  private currentAdminEmail: string = '';

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.currentAdminUid = localStorage.getItem('uid') || '';
    this.currentAdminEmail = localStorage.getItem('useremail') || 'admin@example.com';
    
    if (!this.orgId || !this.domainUid) {
        this.showTemporaryMessage('Error: Organization ID or Domain ID missing. Cannot create project.', true);
    }
    if (!this.currentAdminUid || !this.currentAdminEmail) {
        this.showTemporaryMessage('Error: Admin creator information missing. Please log in again.', true);
    }
  }

  showTemporaryMessage(msg: string, isError: boolean = false) {
    if (isError) {
      this.errorMessage = msg;
      setTimeout(() => { this.errorMessage = ''; }, 5000);
    } else {
      this.message = msg;
      setTimeout(() => { this.message = ''; }, 5000);
    }
  }

  addAsset() {
    if (this.currentAssetKey && this.currentAssetUrl) {
      this.projectAssets.push({ key: this.currentAssetKey, url: this.currentAssetUrl });
      this.currentAssetKey = '';
      this.currentAssetUrl = '';
    } else {
      this.showTemporaryMessage('Asset name and URL cannot be empty.', true);
    }
  }

  removeAsset(index: number) {
    this.projectAssets.splice(index, 1);
  }

  async addUserToProject() {
    const email = this.currentUserEmailInput.trim();
    if (!email) {
      this.showTemporaryMessage('User email cannot be empty.', true);
      return;
    }

    if (this.usersWorkingOnProject.some(u => u.email === email)) {
      this.showTemporaryMessage('User already added to this project.', false);
      this.currentUserEmailInput = '';
      return;
    }

    let foundUid = '';
    try {
        const usersRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/users`);
        const qUsers = query(usersRef, where('email', '==', email));
        const userSnap = await getDocs(qUsers);

        if (!userSnap.empty) {
            foundUid = userSnap.docs[0].id;
        } else {
            const adminsRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/admins`);
            const qAdmins = query(adminsRef, where('email', '==', email));
            const adminSnap = await getDocs(qAdmins);

            if (!adminSnap.empty) {
                foundUid = adminSnap.docs[0].id;
            }
        }
        
        this.usersWorkingOnProject.push({ uid: foundUid, email: email });
        this.currentUserEmailInput = '';
        if (!foundUid) {
            this.showTemporaryMessage(`User ${email} not found in domain, added with empty UID.`, true);
        }
    } catch (error) {
        console.error("Error finding user's UID:", error);
        this.showTemporaryMessage("Error looking up user. Adding with empty UID.", true);
        this.usersWorkingOnProject.push({ uid: '', email: email });
        this.currentUserEmailInput = '';
    }
  }

  removeUserFromProject(index: number) {
    this.usersWorkingOnProject.splice(index, 1);
  }

  async addTask() {
    if (!this.currentTaskDescription || !this.currentTaskDueDate || !this.currentTaskStatus) {
      this.showTemporaryMessage('Task description, due date, and status are required.', true);
      return;
    }

    const assignedUsers: AssignedUser[] = [];
    const assigneeEmails = this.currentTaskAssignedUserEmailInput.split(',').map(e => e.trim()).filter(e => e);

    for (const email of assigneeEmails) {
        let foundUid = '';
        try {
            const usersRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/users`);
            const qUsers = query(usersRef, where('email', '==', email));
            const userSnap = await getDocs(qUsers);

            if (!userSnap.empty) {
                foundUid = userSnap.docs[0].id;
            } else {
                const adminsRef = collection(this.firestore, `organizations/${this.orgId}/domain/${this.domainUid}/admins`);
                const qAdmins = query(adminsRef, where('email', '==', email));
                const adminSnap = await getDocs(qAdmins);

                if (!adminSnap.empty) {
                    foundUid = adminSnap.docs[0].id;
                }
            }
            assignedUsers.push({ uid: foundUid, email: email });
            if (!foundUid) {
                console.warn(`Assignee ${email} not found in domain, added to task with empty UID.`);
            }
        } catch (error) {
            console.error(`Error finding UID for assignee ${email}:`, error);
            assignedUsers.push({ uid: '', email: email });
        }
    }

    this.projectTasks.push({
      description: this.currentTaskDescription,
      dueDate: Timestamp.fromDate(new Date(this.currentTaskDueDate)),
      reminderDate: this.currentTaskReminderDate ? Timestamp.fromDate(new Date(this.currentTaskReminderDate)) : Timestamp.now(),
      createdAt: Timestamp.now(),
      status: this.currentTaskStatus,
      assignedTo: assignedUsers,
    });

    this.currentTaskDescription = '';
    this.currentTaskDueDate = '';
    this.currentTaskReminderDate = '';
    this.currentTaskStatus = 'not yet started';
    this.currentTaskAssignedUserEmailInput = '';
  }

  removeTask(index: number) {
    this.projectTasks.splice(index, 1);
  }

  /**
   * Helper method to format assigned users' emails for display in the template.
   * This prevents the "Bindings cannot contain assignments" error.
   */
  getAssignedEmails(assignedUsers: AssignedUser[]): string {
    if (!assignedUsers || assignedUsers.length === 0) {
      return 'N/A';
    }
    return assignedUsers.map(u => u.email).join(', ');
  }

  async createProject() {
    if (!this.orgId || !this.domainUid) {
      this.showTemporaryMessage('Error: Organization ID or Domain ID is missing. Cannot create project.', true);
      return;
    }
    if (!this.projectName) {
      this.showTemporaryMessage('Project name is required.', true);
      return;
    }
    if (!this.currentAdminUid || !this.currentAdminEmail) {
        this.showTemporaryMessage('Admin creator information (UID/Email) is missing. Please log in again.', true);
        return;
    }

    try {
      const projectsCollectionRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/projects`
      );
      const newProjectRef = doc(projectsCollectionRef);

      const projectData: ProjectDocument = {
        uid: newProjectRef.id,
        name: this.projectName,
        description: this.projectDescription,
        orgId: this.orgId,
        domainUid: this.domainUid,
        createdBy: {
          uid: this.currentAdminUid,
          email: this.currentAdminEmail,
        },
        assets: this.projectAssets,
        usersWorkingOnProject: this.usersWorkingOnProject,
        tasks: this.projectTasks,
        createdAt: Timestamp.now(),
        isActive: true,
      };

      await setDoc(newProjectRef, projectData);

      logAuditActionWithSetDoc(
        this.firestore,
        this.currentAdminUid,
        'project_creation',
        newProjectRef.id,
        'success'
      );

      this.showTemporaryMessage('Project created successfully!');
      this.resetForm();
    } catch (error: any) {
      console.error('Error creating project:', error);
      this.showTemporaryMessage(`Failed to create project: ${error.message || 'An unknown error occurred.'}`, true);
    }
  }

  resetForm() {
    this.projectName = '';
    this.projectDescription = '';
    this.projectAssets = [];
    this.currentAssetKey = '';
    this.currentAssetUrl = '';
    this.usersWorkingOnProject = [];
    this.currentUserEmailInput = '';
    this.projectTasks = [];
    this.currentTaskDescription = '';
    this.currentTaskDueDate = '';
    this.currentTaskReminderDate = '';
    this.currentTaskStatus = 'not yet started';
    this.currentTaskAssignedUserEmailInput = '';
  }
}
