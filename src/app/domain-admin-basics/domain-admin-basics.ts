// src/app/create-project/create-project.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc, // Added for updating tasks/projects
  deleteDoc, // Added for deleting tasks/projects
} from '@angular/fire/firestore';

// Import the interfaces from the new file
import {
  ProjectAsset,
  AssignedUser,
  ProjectTask,
  ProjectDocument,
} from '../models/models'; // Adjusted path
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; // Adjusted path
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-create-project', // Renamed conceptually, but selector remains for consistency
  standalone: true,
  imports: [FormsModule, CommonModule],
  providers: [DatePipe],
  template: `
  <div class="min-h-screen bg-gray-50 text-gray-800 font-poppins p-4 sm:p-6 rounded-xl overflow-hidden">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
    body {
      font-family: 'Poppins', sans-serif;
    }

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

  <header class="bg-white p-6 rounded-xl shadow-lg mb-6 text-center border-2 border-gray-300 animate-slide-in-fade">
    <h1 class="text-4xl font-extrabold text-custom-gradient flex items-center justify-center">
      Project & Task Management
    </h1>
    <p class="text-lg text-gray-600 mt-3">
      Organization:
      <strong class="font-semibold text-blue-600">{{ orgId || 'N/A' }}</strong>
      | Domain:
      <strong class="font-semibold text-pink-600">{{
        domainUid || 'N/A'
      }}</strong>
    </p>
  </header>

  <!-- Messages -->
  <div
    *ngIf="message"
    class="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-4 shadow-md"
    role="alert"
  >
    <span class="block sm:inline font-medium">{{ message }}</span>
    <button
      type="button"
      class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-green-600 hover:text-green-800"
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
        class="h-6 w-6"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    </button>
  </div>

  <div
    *ngIf="errorMessage"
    class="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-4 shadow-md"
    role="alert"
  >
    <span class="block sm:inline font-medium">{{ errorMessage }}</span>
    <button
      type="button"
      class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-red-600 hover:text-red-800"
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
        class="h-6 w-6"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    </button>
  </div>

  <main class="flex flex-col lg:flex-row gap-6">
    <!-- Left Column: Create Project & Project Search -->
    <section
      class="lg:w-1/2  p-6 rounded-xl shadow-lg border-2 border-gray-300 animate-slide-in-fade"
    >
      <!-- Create New Project Form -->
      <form
        (ngSubmit)="createProject()"
        class="space-y-6 mb-8 pb-8 border-b-2 border-gray-300"
      >
        <h3 class="text-2xl font-bold text-center text-custom-gradient">
          Create New Project
        </h3>

        <div>
          <label
            for="projectName"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Project Name:</label
          >
          <input
            type="text"
            id="projectName"
            [(ngModel)]="projectName"
            name="projectName"
            placeholder="Enter project name"
            required
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>

        <div>
          <label
            for="projectDescription"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Project Description:</label
          >
          <textarea
            id="projectDescription"
            [(ngModel)]="projectDescription"
            name="projectDescription"
            rows="3"
            placeholder="Describe the project"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          ></textarea>
        </div>

        <div class="border-2 border-gray-300 p-4 rounded-lg space-y-2 bg-white shadow-sm">
          <h4
            class="text-lg font-semibold text-blue-600 mb-3 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mr-2 text-yellow-500"
            >
              <path
                d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
              />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Project Assets (Documents/Images)
          </h4>
          <div
            class="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0 mb-4"
          >
            <input
              type="text"
              [(ngModel)]="currentAssetKey"
              name="currentAssetKey"
              placeholder="Asset Name (e.g., Design Doc)"
              class="flex-grow p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
            />
            <input
              type="text"
              [(ngModel)]="currentAssetUrl"
              name="currentAssetUrl"
              placeholder="URL to Image/Document"
              class="flex-grow p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
            />
            <button
              type="button"
              (click)="addAsset()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 whitespace-nowrap"
            >
              +
            </button>
          </div>
          <ul
            *ngIf="projectAssets.length > 0"
            class="list-disc pl-5 space-y-2 overflow-y-auto max-h-48 custom-scrollbar"
          >
            <li
              *ngFor="let asset of projectAssets; let i = index"
              class="p-2 border border-gray-200 rounded-md bg-white flex items-center justify-between shadow-sm"
            >
              <span class="break-all text-gray-800"
                >{{ asset.key }}:
                <a
                  [href]="asset.url"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                  >{{ asset.url }}</a
                ></span
              >
              <button
                type="button"
                (click)="removeAsset(i)"
                class="ml-4 text-red-600 hover:text-red-800 text-sm font-semibold transition"
              >
                Remove
              </button>
            </li>
          </ul>
          <p
            *ngIf="projectAssets.length === 0"
            class="text-gray-500 text-sm mt-2"
          >
            No assets added yet.
          </p>
        </div>

        <button
          type="submit"
          class="w-full bg-custom-gradient text-white py-3 px-6 rounded-lg hover:opacity-90 active:opacity-100 transition font-bold text-lg transform hover:-translate-y-0.5"
        >
          Create Project
        </button>
      </form>

      <!-- Project Search Section -->
      <section class="mt-8">
        <h3 class="text-2xl font-bold text-center text-custom-gradient mb-4">
          Search Existing Projects
        </h3>
        <div class="mb-4">
          <input
            type="text"
            placeholder="Search projects by name or description..."
            [(ngModel)]="searchTermProjects"
            name="searchTermProjects"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>
        <div class="overflow-y-auto max-h-96 custom-scrollbar rounded-lg border-2 border-gray-300 shadow-md">
          <table class="min-w-full bg-white rounded-lg overflow-hidden">
            <thead>
              <tr
                class="bg-gray-200 text-gray-700 uppercase text-sm leading-normal"
              >
                <th class="py-3 px-6 text-left">Project Name</th>
                <th class="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="text-gray-800 text-sm font-light">
              <tr
                *ngFor="let project of filteredProjects"
                class="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out"
              >
                <td class="py-3 px-6 text-left whitespace-nowrap">
                  {{ project.name }}
                </td>
                <td class="py-3 px-6 text-center">
                  <button
                    (click)="selectProject(project)"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    Select
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
    </section>

    <!-- Right Column: Task Management for Selected Project -->
    <section
      *ngIf="selectedProject"
      class="lg:w-1/2 bg-gray-100 p-6 rounded-xl shadow-lg border-2 border-gray-300 animate-slide-in-fade"
    >
      <h3 class="text-2xl font-bold text-center text-custom-gradient mb-4">
        Tasks for:
        <span class="text-blue-600">{{ selectedProject.name }}</span>
        <button
          (click)="selectedProject = null; resetTaskForm()"
          class="ml-4 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
        >
          (Clear Selection)
        </button>
      </h3>

      <!-- Task Creation/Edit Form -->
      <form
        (ngSubmit)="editingTask ? updateTask() : addTask()"
        class="space-y-4 mb-8 pb-8 border-b-2 border-gray-300"
      >
        <h4
          class="text-xl font-semibold text-blue-600 mb-3 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2 text-yellow-500"
          >
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <path d="M10 12h4" />
            <path d="M8 18h8" />
            <path
              d="M16 6H8c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"
            />
          </svg>
          {{ editingTask ? 'Edit Task' : 'Add New Task' }}
        </h4>

        <div>
          <label
            for="taskDescription"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Task Description:</label
          >
          <input
            type="text"
            id="taskDescription"
            [(ngModel)]="currentTaskDescription"
            name="currentTaskDescription"
            placeholder="Describe the task"
            required
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>
        <div>
          <label
            for="taskDueDate"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Due Date:</label
          >
          <input
            type="date"
            id="taskDueDate"
            [(ngModel)]="currentTaskDueDate"
            name="currentTaskDueDate"
            title="Due Date"
            required
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>
        <div>
          <label
            for="taskReminderDate"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Reminder Date (Optional):</label
          >
          <input
            type="date"
            id="taskReminderDate"
            [(ngModel)]="currentTaskReminderDate"
            name="currentTaskReminderDate"
            title="Reminder Date"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>
        <div>
          <label
            for="taskStatus"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Status:</label
          >
          <select
            [(ngModel)]="currentTaskStatus"
            name="currentTaskStatus"
            required
            id="taskStatus"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          >
            <option value="not yet started" class="bg-white text-gray-900">
              Not Yet Started
            </option>
            <option value="in progress" class="bg-white text-gray-900">
              In Progress
            </option>
            <option value="completed" class="bg-white text-gray-900">
              Completed
            </option>
          </select>
        </div>
        <div>
          <label
            for="taskAssignedUserEmailInput"
            class="block text-gray-700 text-sm font-medium mb-2"
            >Assignee Email(s) (comma-separated):</label
          >
          <input
            type="text"
            id="taskAssignedUserEmailInput"
            [(ngModel)]="currentTaskAssignedUserEmailInput"
            name="currentTaskAssignedUserEmailInput"
            placeholder="Enter emails to assign"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
          <!-- Optional: Add a dropdown/autocomplete for user search suggestions here -->
          <div
            *ngIf="
              currentTaskAssignedUserEmailInput &&
              filteredDomainUsers.length > 0
            "
            class="bg-white rounded-lg mt-1 max-h-40 overflow-y-auto custom-scrollbar border border-gray-200 shadow-md"
          >
            <div
              *ngFor="let user of filteredDomainUsers"
              (click)="addAssigneeToInput(user.email)"
              class="p-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0 text-gray-800"
            >
              {{ user.email }}
            </div>
          </div>
        </div>
        <div class="flex gap-4 pt-2">
          <button
            type="submit"
            class="flex-grow bg-custom-gradient text-white font-bold py-3 px-6 rounded-lg border-2 border-gray-300
                   hover:opacity-90 active:opacity-100 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            {{ editingTask ? 'Update Task' : 'Add Task' }}
          </button>
          <button
            *ngIf="editingTask"
            type="button"
            (click)="resetTaskForm()"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg border-2 border-gray-300 transition duration-200 ease-in-out transform hover:scale-105"
          >
            Cancel Edit
          </button>
        </div>
      </form>

      <!-- Task List & Search -->
      <section class="mt-8 flex-grow flex flex-col">
        <h4
          class="text-xl font-semibold text-blue-600 mb-4 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2 text-yellow-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Project Tasks
        </h4>
        <div class="mb-4">
          <input
            type="text"
            placeholder="Search tasks by description..."
            [(ngModel)]="taskSearchTerm"
            name="taskSearchTerm"
            class="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          />
        </div>
        <div class="overflow-y-auto flex-grow custom-scrollbar rounded-lg border-2 border-gray-300 shadow-md">
          <table class="min-w-full bg-white rounded-lg overflow-hidden">
            <thead>
              <tr
                class="bg-gray-200 text-gray-700 uppercase text-sm leading-normal"
              >
                <th class="py-3 px-6 text-left">Description</th>
                <th class="py-3 px-6 text-center">Status</th>
                <th class="py-3 px-6 text-center">Due Date</th>
                <th class="py-3 px-6 text-center">Assigned To</th>
                <th class="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="text-gray-800 text-sm font-light">
              <tr
                *ngFor="let task of filteredTasks; let i = index"
                class="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out"
              >
                <td class="py-3 px-6 text-left">{{ task.description }}</td>
                <td class="py-3 px-6 text-center">
                  <span
                    [ngClass]="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-opacity-50': task.status === 'in progress',
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-opacity-50': task.status === 'completed',
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-opacity-50': task.status === 'not yet started'
                    }"
                  >
                    {{ task.status | titlecase }}
                  </span>
                </td>
                <td class="py-3 px-6 text-center">
                  {{ task.dueDate.toDate() | date : 'shortDate' }}
                </td>
                <td class="py-3 px-6 text-center">
                  {{ getAssignedEmails(task.assignedTo) }}
                </td>
                <td class="py-3 px-6 text-center">
                  <div class="flex item-center justify-center space-x-2">
                    <button
                      (click)="editTask(task)"
                      class="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110"
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
                        class="h-4 w-4"
                      >
                        <path
                          d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                        />
                      </svg>
                    </button>
                    <button
                      (click)="confirmDeleteTask(task)"
                      class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition duration-200 ease-in-out transform hover:scale-110"
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
                        class="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredTasks.length === 0">
                <td colspan="5" class="py-4 text-center text-gray-500">
                  No tasks found for this project.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </main>

  <!-- Custom Confirmation Modal -->
  <div
    *ngIf="showConfirmModal"
    class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-slide-in-fade"
  >
    <div
      class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center space-y-4 border-2 border-gray-300"
    >
      <p class="text-lg text-gray-800 font-medium">{{ confirmModalMessage }}</p>
      <div class="flex justify-center space-x-4">
        <button
          (click)="confirmModalAction && confirmModalAction()"
          class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          Confirm
        </button>
        <button
          (click)="showConfirmModal = false"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>

  `,
})
export class CreateProjectComponent implements OnInit {
  @Input() orgId!: string | null;
  @Input() domainUid!: string | null;

  // Form States for New Project Creation
  projectName: string = '';
  projectDescription: string = '';
  projectAssets: ProjectAsset[] = [];
  currentAssetKey: string = '';
  currentAssetUrl: string = '';

  // General Component States
  message: string = '';
  errorMessage: string = '';

  private currentAdminUid: string = '';
  private currentAdminEmail: string = '';

  // Project Search & Selection States
  projectsList: ProjectDocument[] = [];
  searchTermProjects: string = '';
  selectedProject: ProjectDocument | null = null;

  // Task Management States
  projectTasks: ProjectTask[] = []; // Tasks for the currently selected project
  currentTaskDescription: string = '';
  currentTaskDueDate: string = '';
  currentTaskReminderDate: string = '';
  currentTaskStatus: 'not yet started' | 'in progress' | 'completed' =
    'not yet started';
  currentTaskAssignedUserEmailInput: string = '';
  taskSearchTerm: string = '';
  editingTask: ProjectTask | null = null; // Holds the task being edited

  // User Search for Task Assignment
  allDomainUsers: AssignedUser[] = []; // All users and admins in the domain

  // Custom Confirmation Modal State
  showConfirmModal: boolean = false;
  confirmModalMessage: string = '';
  confirmModalAction: (() => void) | null = null;

  constructor(private firestore: Firestore, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.currentAdminUid = localStorage.getItem('uid') || '';
    this.currentAdminEmail =
      localStorage.getItem('useremail') || 'admin@example.com';

    if (!this.orgId || !this.domainUid) {
      this.showTemporaryMessage(
        'Error: Organization ID or Domain ID missing. Cannot manage projects.',
        true
      );
    }
    if (!this.currentAdminUid || !this.currentAdminEmail) {
      this.showTemporaryMessage(
        'Error: Admin creator information missing. Please log in again.',
        true
      );
    }

    // Fetch all projects and domain users on component initialization
    if (this.orgId && this.domainUid) {
      this.fetchProjects();
      this.fetchDomainUsers();
    }
  }

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

  // --- Project Creation Methods ---
  addAsset() {
    if (this.currentAssetKey && this.currentAssetUrl) {
      this.projectAssets.push({
        key: this.currentAssetKey,
        url: this.currentAssetUrl,
      });
      this.currentAssetKey = '';
      this.currentAssetUrl = '';
    } else {
      this.showTemporaryMessage('Asset name and URL cannot be empty.', true);
    }
  }

  removeAsset(index: number) {
    this.projectAssets.splice(index, 1);
  }

  async createProject() {
    if (!this.orgId || !this.domainUid) {
      this.showTemporaryMessage(
        'Error: Organization ID or Domain ID is missing. Cannot create project.',
        true
      );
      return;
    }
    if (!this.projectName) {
      this.showTemporaryMessage('Project name is required.', true);
      return;
    }
    if (!this.currentAdminUid || !this.currentAdminEmail) {
      this.showTemporaryMessage(
        'Admin creator information (UID/Email) is missing. Please log in again.',
        true
      );
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
        usersWorkingOnProject: [], // New projects start with no assigned project users
        tasks: [], // New projects start with no tasks
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
      this.resetCreateProjectForm(); // Reset only the creation form
      this.fetchProjects(); // Refresh the list of projects
    } catch (error: any) {
      console.error('Error creating project:', error);
      this.showTemporaryMessage(
        `Failed to create project: ${
          error.message || 'An unknown error occurred.'
        }`,
        true
      );
    }
  }

  resetCreateProjectForm() {
    this.projectName = '';
    this.projectDescription = '';
    this.projectAssets = [];
    this.currentAssetKey = '';
    this.currentAssetUrl = '';
  }

  // --- Project Search & Selection Methods ---
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
      const q = query(projectsCollectionRef);
      const querySnapshot = await getDocs(q);
      this.projectsList = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...(doc.data() as Omit<ProjectDocument, 'uid'>),
      }));
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

  selectProject(project: ProjectDocument): void {
    this.selectedProject = project;
    this.projectTasks = project.tasks || []; // Load tasks for the selected project
    this.resetTaskForm(); // Clear task form when selecting a new project
  }

  // --- Task Management Methods ---

  // Fetches all users (and admins) in the domain for task assignment
  async fetchDomainUsers(): Promise<void> {
    if (!this.orgId || !this.domainUid) return;

    try {
      const usersRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/users`
      );
      const usersSnap = await getDocs(usersRef);
      const users = usersSnap.docs.map((doc) => ({
        uid: doc.id,
        email: doc.data()['email'],
      }));

      const adminsRef = collection(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/admins`
      );
      const adminsSnap = await getDocs(adminsRef);
      const admins = adminsSnap.docs.map((doc) => ({
        uid: doc.id,
        email: doc.data()['email'],
      }));

      this.allDomainUsers = [...users, ...admins];
    } catch (error) {
      console.error('Error fetching domain users/admins:', error);
      this.showTemporaryMessage(
        'Failed to load domain users for task assignment.',
        true
      );
    }
  }

  get filteredDomainUsers(): AssignedUser[] {
    const inputEmails = this.currentTaskAssignedUserEmailInput
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const lastInput = inputEmails[inputEmails.length - 1]; // Get the last part for active filtering

    if (!lastInput) {
      return []; // Don't show suggestions if input is empty or only commas
    }

    // Filter users that match the last part of the input and are not already fully typed in the input
    return this.allDomainUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(lastInput) &&
        !inputEmails.includes(user.email.toLowerCase()) // Don't suggest if already typed
    );
  }

  addAssigneeToInput(email: string): void {
    let currentEmails = this.currentTaskAssignedUserEmailInput
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);
    const lastInput = currentEmails[currentEmails.length - 1];

    if (currentEmails.length > 0 && lastInput) {
      // Replace the last partial input with the selected full email
      currentEmails[currentEmails.length - 1] = email;
    } else {
      // Add the email if input was empty or only commas
      currentEmails.push(email);
    }

    this.currentTaskAssignedUserEmailInput =
      currentEmails.join(', ') + (currentEmails.length > 0 ? ', ' : '');
  }

  async addTask() {
    if (!this.selectedProject) {
      this.showTemporaryMessage('Please select a project first.', true);
      return;
    }
    if (
      !this.currentTaskDescription ||
      !this.currentTaskDueDate ||
      !this.currentTaskStatus
    ) {
      this.showTemporaryMessage(
        'Task description, due date, and status are required.',
        true
      );
      return;
    }

    const assignedUsers: AssignedUser[] = await this.resolveAssigneeEmails(
      this.currentTaskAssignedUserEmailInput
    );
    const newTaskUid = uuidv4();
    const newTask: ProjectTask = {
      id: newTaskUid,
      description: this.currentTaskDescription,
      dueDate: Timestamp.fromDate(new Date(this.currentTaskDueDate)),
      reminderDate: this.currentTaskReminderDate
        ? Timestamp.fromDate(new Date(this.currentTaskReminderDate))
        : undefined,
      createdAt: Timestamp.now(),
      status: this.currentTaskStatus,
      assignedTo: assignedUsers,
    };

    this.projectTasks.push(newTask); // Add to local array
    await this.updateProjectTasksInFirestore(); // Persist changes to Firestore

    logAuditActionWithSetDoc(
      this.firestore,
      this.currentAdminUid,
      'task_creation',
      `${this.selectedProject.uid}_${newTask.description}`, // Simple ID for audit log
      'success'
    );

    this.showTemporaryMessage('Task added successfully!');
    this.resetTaskForm();
  }

  async updateTask() {
    if (!this.selectedProject || !this.editingTask) {
      this.showTemporaryMessage(
        'No project selected or task being edited.',
        true
      );
      return;
    }
    if (
      !this.currentTaskDescription ||
      !this.currentTaskDueDate ||
      !this.currentTaskStatus
    ) {
      this.showTemporaryMessage(
        'Task description, due date, and status are required.',
        true
      );
      return;
    }

    const assignedUsers: AssignedUser[] = await this.resolveAssigneeEmails(
      this.currentTaskAssignedUserEmailInput
    );

    // Find the index of the task being edited
    const index = this.projectTasks.findIndex((t) => t === this.editingTask);
    if (index > -1) {
      this.projectTasks[index] = {
        ...this.projectTasks[index], // Keep existing properties not in form
        description: this.currentTaskDescription,
        dueDate: Timestamp.fromDate(new Date(this.currentTaskDueDate)),
        reminderDate: this.currentTaskReminderDate
          ? Timestamp.fromDate(new Date(this.currentTaskReminderDate))
          : undefined,
        status: this.currentTaskStatus,
        assignedTo: assignedUsers,
      };
      await this.updateProjectTasksInFirestore(); // Persist changes to Firestore

      logAuditActionWithSetDoc(
        this.firestore,
        this.currentAdminUid,
        'task_update',
        `${this.selectedProject.uid}_${this.editingTask.description}`, // Simple ID for audit log
        'success'
      );

      this.showTemporaryMessage('Task updated successfully!');
      this.resetTaskForm();
    } else {
      this.showTemporaryMessage('Error: Task not found for update.', true);
    }
  }

  confirmDeleteTask(taskToDelete: ProjectTask): void {
    this.confirmModalMessage = `Are you sure you want to delete task "${taskToDelete.description}"? This action cannot be undone.`;
    this.confirmModalAction = () => this.deleteTaskConfirmed(taskToDelete);
    this.showConfirmModal = true;
  }

  async deleteTaskConfirmed(taskToDelete: ProjectTask): Promise<void> {
    if (!this.selectedProject) {
      this.showTemporaryMessage('No project selected.', true);
      this.showConfirmModal = false;
      return;
    }

    const initialTaskCount = this.projectTasks.length;
    this.projectTasks = this.projectTasks.filter(
      (task) => task !== taskToDelete
    );

    if (this.projectTasks.length < initialTaskCount) {
      await this.updateProjectTasksInFirestore(); // Persist changes to Firestore

      logAuditActionWithSetDoc(
        this.firestore,
        this.currentAdminUid,
        'task_deletion',
        `${this.selectedProject.uid}_${taskToDelete.description}`, // Simple ID for audit log
        'success'
      );
      this.showTemporaryMessage(
        `Task "${taskToDelete.description}" deleted successfully!`
      );
    } else {
      this.showTemporaryMessage('Error: Task not found for deletion.', true);
    }
    this.showConfirmModal = false;
    this.resetTaskForm(); // Clear form after deletion
  }

  editTask(task: ProjectTask): void {
    this.editingTask = task;
    this.currentTaskDescription = task.description;
    this.currentTaskDueDate = task.dueDate.toDate().toISOString().split('T')[0]; // Format for date input
    this.currentTaskReminderDate = task.reminderDate
      ? task.reminderDate.toDate().toISOString().split('T')[0]
      : '';
    this.currentTaskStatus = task.status;
    this.currentTaskAssignedUserEmailInput = this.getAssignedEmails(
      task.assignedTo
    );
  }

  resetTaskForm(): void {
    this.currentTaskDescription = '';
    this.currentTaskDueDate = '';
    this.currentTaskReminderDate = '';
    this.currentTaskStatus = 'not yet started';
    this.currentTaskAssignedUserEmailInput = '';
    this.editingTask = null;
  }

  get filteredTasks(): ProjectTask[] {
    if (!this.selectedProject) {
      return [];
    }
    if (!this.taskSearchTerm) {
      return this.projectTasks;
    }
    const lowerCaseSearchTerm = this.taskSearchTerm.toLowerCase();
    return this.projectTasks.filter(
      (task) =>
        task.description.toLowerCase().includes(lowerCaseSearchTerm) ||
        task.assignedTo.some((user) =>
          user.email.toLowerCase().includes(lowerCaseSearchTerm)
        ) ||
        task.status.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }

  /**
   * Helper method to resolve email strings to AssignedUser objects with UIDs.
   */
  private async resolveAssigneeEmails(
    emailString: string
  ): Promise<AssignedUser[]> {
    const assigneeEmails = emailString
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e);
    const resolvedUsers: AssignedUser[] = [];

    for (const email of assigneeEmails) {
      let foundUid = '';
      const foundUser = this.allDomainUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (foundUser) {
        foundUid = foundUser.uid;
      } else {
        console.warn(
          `Assignee ${email} not found in domain users/admins. Adding with empty UID.`
        );
      }
      resolvedUsers.push({ uid: foundUid, email: email });
    }
    return resolvedUsers;
  }

  /**
   * Updates the tasks array for the currently selected project in Firestore.
   */
  private async updateProjectTasksInFirestore(): Promise<void> {
    if (!this.selectedProject || !this.orgId || !this.domainUid) {
      this.showTemporaryMessage(
        'Cannot save tasks: No project selected or domain info missing.',
        true
      );
      return;
    }
    try {
      const projectDocRef = doc(
        this.firestore,
        `organizations/${this.orgId}/domain/${this.domainUid}/projects/${this.selectedProject.uid}`
      );
      await updateDoc(projectDocRef, { tasks: this.projectTasks });
      // Update the selectedProject's tasks locally to reflect changes
      this.selectedProject.tasks = this.projectTasks;
      // Also update the projectsList in case the selected project is from there
      const projectIndex = this.projectsList.findIndex(
        (p) => p.uid === this.selectedProject?.uid
      );
      if (projectIndex > -1) {
        this.projectsList[projectIndex].tasks = this.projectTasks;
      }
    } catch (error) {
      console.error('Error updating project tasks in Firestore:', error);
      this.showTemporaryMessage('Failed to save project tasks.', true);
    }
  }

  /**
   * Helper method to format assigned users' emails for display in the template.
   */
  getAssignedEmails(assignedUsers: AssignedUser[]): string {
    if (!assignedUsers || assignedUsers.length === 0) {
      return 'N/A';
    }
    return assignedUsers.map((u) => u.email).join(', ');
  }

  /**
   * Helper method to format a Timestamp or return 'N/A' if null/undefined or invalid date.
   */
  getFormattedDate(timestamp: Timestamp | undefined | null): string {
    if (timestamp) {
      const date = timestamp.toDate();
      // Check if the date is valid (e.g., not "Invalid Date")
      if (!isNaN(date.getTime())) {
        return this.datePipe.transform(date, 'mediumDate') || 'N/A';
      }
    }
    return 'N/A';
  }
}
