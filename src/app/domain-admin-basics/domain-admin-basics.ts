// src/app/create-project/create-project.component.ts

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
import { ProjectAsset, AssignedUser, ProjectTask, ProjectDocument } from '../models/models'

// IMPORTANT: Ensure you have this utility function for audit logging.
// If not, remove the import and calls, or create a placeholder.
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';


@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe], // Include DatePipe for formatting dates in template
  template: `
    <form (ngSubmit)="createProject()" class="bg-white shadow-md rounded-xl p-6 max-w-2xl mx-auto space-y-6 mt-8">
      <h3 class="text-2xl font-bold text-center text-gray-800">Create New Project</h3>

      <div *ngIf="message" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline">{{ message }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" (click)="message = ''">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z" />
          </svg>
        </span>
      </div>

      <div *ngIf="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" (click)="errorMessage = ''">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 2.65a1.2 1.2 0 1 1-1.697-1.697L8.303 10l-2.651-2.651a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-2.651a1.2 1.2 0 1 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.697z" />
          </svg>
        </span>
      </div>

      <div>
        <label for="projectName" class="block text-gray-700 text-sm font-bold mb-2">Project Name:</label>
        <input type="text" id="projectName" [(ngModel)]="projectName" name="projectName" required
               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>

      <div>
        <label for="projectDescription" class="block text-gray-700 text-sm font-bold mb-2">Project Description:</label>
        <textarea id="projectDescription" [(ngModel)]="projectDescription" name="projectDescription" rows="3"
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
      </div>

      <div class="border p-4 rounded-md">
        <h4 class="text-lg font-semibold mb-3">Project Assets (Documents/Images)</h4>
        <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 mb-2">
          <input type="text" [(ngModel)]="currentAssetKey" name="currentAssetKey" placeholder="Asset Name (e.g., Design Doc)"
                 class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow" />
          <input type="text" [(ngModel)]="currentAssetUrl" name="currentAssetUrl" placeholder="URL to Image/Document"
                 class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow" />
          <button type="button" (click)="addAsset()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">Add Asset</button>
        </div>
        <ul *ngIf="projectAssets.length > 0" class="list-disc pl-5">
          <li *ngFor="let asset of projectAssets; let i = index">
            {{ asset.key }}: <a [href]="asset.url" target="_blank" class="text-blue-600 hover:underline break-all">{{ asset.url }}</a>
            <button type="button" (click)="removeAsset(i)" class="ml-2 text-red-500 hover:text-red-700 text-sm">Remove</button>
          </li>
        </ul>
        <p *ngIf="projectAssets.length === 0" class="text-gray-500 text-sm">No assets added yet.</p>
      </div>

      <div class="border p-4 rounded-md">
        <h4 class="text-lg font-semibold mb-3">Users Working on this Project</h4>
        <div class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 mb-2">
          <input type="email" [(ngModel)]="currentUserEmailInput" name="currentUserEmailInput" placeholder="User Email (e.g., user@example.com)"
                 class="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow" />
          <button type="button" (click)="addUserToProject()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">Add User</button>
        </div>
        <ul *ngIf="usersWorkingOnProject.length > 0" class="list-disc pl-5">
          <li *ngFor="let user of usersWorkingOnProject; let i = index">
            {{ user.email }} (UID: {{ user.uid || 'N/A' }})
            <button type="button" (click)="removeUserFromProject(i)" class="ml-2 text-red-500 hover:text-red-700 text-sm">Remove</button>
          </li>
        </ul>
        <p *ngIf="usersWorkingOnProject.length === 0" class="text-gray-500 text-sm">No users added to this project yet.</p>
      </div>

      <div class="border p-4 rounded-md">
        <h4 class="text-lg font-semibold mb-3">Tasks for this Project</h4>
        <div class="space-y-2">
          <input type="text" [(ngModel)]="currentTaskDescription" name="currentTaskDescription" placeholder="Task Description"
                 class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          <label for="taskDueDate" class="block text-gray-700 text-sm mb-0">Due Date:</label>
          <input type="date" id="taskDueDate" [(ngModel)]="currentTaskDueDate" name="currentTaskDueDate" title="Due Date" required
                 class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          <label for="taskReminderDate" class="block text-gray-700 text-sm mb-0">Reminder Date (Optional):</label>
          <input type="date" id="taskReminderDate" [(ngModel)]="currentTaskReminderDate" name="currentTaskReminderDate" title="Reminder Date"
                 class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          <select [(ngModel)]="currentTaskStatus" name="currentTaskStatus" required
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="not yet started">Not Yet Started</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <input type="email" [(ngModel)]="currentTaskAssignedUserEmailInput" name="currentTaskAssignedUserEmailInput" placeholder="Assignee Email(s) (comma-separated)"
                 class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          <button type="button" (click)="addTask()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">Add Task</button>
        </div>
        <ul *ngIf="projectTasks.length > 0" class="list-disc pl-5 mt-4">
          <li *ngFor="let task of projectTasks; let i = index" class="mb-2 p-2 border rounded">
            <strong>Task:</strong> {{ task.description }}<br>
            <strong>Status:</strong> {{ task.status | titlecase }}<br>
            <strong>Due:</strong> {{ task.dueDate.toDate() | date:'mediumDate' }}<br>
            <strong>Reminder:</strong> {{ task.reminderDate.toDate() | date:'mediumDate' }}<br>
            <strong>Created:</strong> {{ task.createdAt.toDate() | date:'mediumDate' }}<br>
            <strong>Assigned To:</strong> {{ getAssignedEmails(task.assignedTo) }} <button type="button" (click)="removeTask(i)" class="ml-2 text-red-500 hover:text-red-700 text-sm">Remove</button>
          </li>
        </ul>
        <p *ngIf="projectTasks.length === 0" class="text-gray-500 text-sm">No tasks added yet.</p>
      </div>

      <button type="submit"
              class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition font-bold text-lg">
        Create Project
      </button>
    </form>
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