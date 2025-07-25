// src/app/dashboard/dashboard.component.ts

import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  Type,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, NgIf, TitleCasePipe } from '@angular/common';
import { CreateAdminComponent } from '../create-admin/create-admin';
import { CreateDomainComponent } from '../create-domain/create-domain';
import { CustomButtonsComponent } from '../routechanger/routechanger';
import { CreateProjectComponent } from '../domain-admin-basics/domain-admin-basics';
import { UserManagementComponent } from '../domain-admin-usercrud/domain-admin-usercrud';
import { ProjectUserAssignerComponent } from '../assignuserproject/assignuserproject';
import { UserDashboardComponent } from '../userpanel/userpanel';
import { UserLookupComponent } from '../userdeets/userdeets';

// Import your dynamically loaded components
import { ItDashboardComponent } from '../domain-components/it-component';
import { FinanceDashboardComponent } from '../domain-components/finance-component';
import { Orgstats } from '../orgstats/orgstats';
import { AuditLogViewerComponent } from '../auditpage/auditpage';
import { SignOutButtonComponent } from "../signout/signout";

// NEW IMPORTS FOR CHAT FUNCTIONALITY
import { Firestore, collection, query, getDocs } from '@angular/fire/firestore'; // For fetching projects
import { ProjectDocument } from '../models/models'; // Import ProjectDocument interface
import { ProjectChatComponent } from '../project-chat/project-chat.component'; // Import the chat component
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf,
    CustomButtonsComponent,
    CreateDomainComponent,
    CreateAdminComponent,
    CreateProjectComponent,
    UserManagementComponent,
    CommonModule,
    FormsModule, // <--- ADDED for project search input
    ProjectUserAssignerComponent,
    UserDashboardComponent,
    UserLookupComponent,
    ItDashboardComponent,
    FinanceDashboardComponent,
    TitleCasePipe,
    Orgstats,
    AuditLogViewerComponent,
    SignOutButtonComponent,
    ProjectChatComponent // <--- IMPORTED ProjectChatComponent
  ],
  template: `
    <div
      class="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-poppins text-gray-800"
    >
      <style>
        /* Google Font: Poppins */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }

        /* Custom Spinner Animation (if needed for data loading) */
        @keyframes spin-loader {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .loader-spinner {
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top: 2px solid #2563eb; /* Blue accent for spinner */
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin-loader 1s linear infinite;
        }

        /* Card Entry Animation */
        @keyframes slide-in-fade {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-fade {
          animation: slide-in-fade 0.6s ease-out forwards;
        }

        /* Pulsing dot animation (for consistency, though not used here directly) */
        @keyframes pulse-dot {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
        .animate-pulse-dot {
          animation: pulse-dot 1s infinite;
        }

        /* --- CUSTOM GRADIENT STYLES (Yellow & Hot Pink) --- */
        .text-custom-gradient {
          background: linear-gradient(
            to right,
            #ffea00,
            #ff1493
          ); /* Bright Yellow to Hot Pink */
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          display: inline-block;
        }

        .bg-custom-gradient {
          background: linear-gradient(
            to right,
            #ffea00,
            #ff1493
          ); /* Bright Yellow to Hot Pink */
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
      </style>

      <div
        class="max-w-8xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-8 border-2 border-gray-300 animate-slide-in-fade"
      >
        <div class="text-center pb-4 border-b border-gray-200">
          <h1 class="text-4xl font-extrabold text-custom-gradient">
            Welcome to the Dashboard
          </h1>
          <p class="mt-3 text-lg text-gray-600">
            Your role:
            <strong class="text-blue-600">{{ role | titlecase }}</strong>
            <span *ngIf="userDepartment">
              | Department:
              <strong class="text-pink-600">{{
                userDepartment | titlecase
              }}</strong>
            </span>
          </p>
        </div>

        <!-- INLINED: Horizontal Navigation Bar HTML - Restyled -->
        <div class="mt-8 mb-8 p-4 rounded-lg">
          <nav class="flex flex-wrap justify-start gap-4">
            <!-- Role-based Links -->
            <button
              *ngIf="role === 'root'"
              (click)="onNavigateToSection('root')"
              [class.bg-gray-200]="activeSection === 'root'"
              [class.text-custom-gradient]="activeSection === 'root'"
              [class.border-b-2]="activeSection === 'root'"
              [class.border-pink-500]="activeSection === 'root'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Root Features
            </button>

            <button
              *ngIf="role === 'admin'"
              (click)="onNavigateToSection('admin')"
              [class.bg-gray-200]="activeSection === 'admin'"
              [class.text-custom-gradient]="activeSection === 'admin'"
              [class.border-b-2]="activeSection === 'admin'"
              [class.border-pink-500]="activeSection === 'admin'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Admin Features
            </button>

            <button
              *ngIf="role === 'user'"
              (click)="onNavigateToSection('user')"
              [class.bg-gray-200]="activeSection === 'user'"
              [class.text-custom-gradient]="activeSection === 'user'"
              [class.border-b-2]="activeSection === 'user'"
              [class.border-pink-500]="activeSection === 'user'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              My Tasks
            </button>

            <!-- General Dashboard Overview -->
            <button
              (click)="onNavigateToSection('overview')"
              [class.bg-gray-200]="activeSection === 'overview'"
              [class.text-custom-gradient]="activeSection === 'overview'"
              [class.border-b-2]="activeSection === 'overview'"
              [class.border-pink-500]="activeSection === 'overview'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Overview
            </button>

            <!-- Project Chat Button -->
            <button
              (click)="onNavigateToSection('projectChat')"
              [class.bg-gray-200]="activeSection === 'projectChat'"
              [class.text-custom-gradient]="activeSection === 'projectChat'"
              [class.border-b-2]="activeSection === 'projectChat'"
              [class.border-pink-500]="activeSection === 'projectChat'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Project Chat
            </button>

            <!-- Analytics and Audit Log Links (conditionally rendered) -->
            <button
              *ngIf="customization.userAnalytics"
              (click)="onNavigateToSection('userAnalytics')"
              [class.bg-gray-200]="activeSection === 'userAnalytics'"
              [class.text-custom-gradient]="activeSection === 'userAnalytics'"
              [class.border-b-2]="activeSection === 'userAnalytics'"
              [class.border-pink-500]="activeSection === 'userAnalytics'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              User Analytics
            </button>

            <button
              *ngIf="customization.orgAnalytics"
              (click)="onNavigateToSection('orgAnalytics')"
              [class.bg-gray-200]="activeSection === 'orgAnalytics'"
              [class.text-custom-gradient]="activeSection === 'orgAnalytics'"
              [class.border-b-2]="activeSection === 'orgAnalytics'"
              [class.border-pink-500]="activeSection === 'orgAnalytics'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Org Analytics
            </button>

            <button
              *ngIf="customization.auditLog"
              (click)="onNavigateToSection('auditLog')"
              [class.bg-gray-200]="activeSection === 'auditLog'"
              [class.text-custom-gradient]="activeSection === 'auditLog'"
              [class.border-b-2]="activeSection === 'auditLog'"
              [class.border-pink-500]="activeSection === 'auditLog'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Audit Log
            </button>

            <button
              (click)="onNavigateToSection('signOut')"
              [class.bg-gray-200]="activeSection === 'signOut'"
              [class.text-custom-gradient]="activeSection === 'signOut'"
              [class.border-b-2]="activeSection === 'signOut'"
              [class.border-pink-500]="activeSection === 'signOut'"
              class="py-2 px-5 rounded-md font-semibold text-gray-700 hover:bg-gray-200 hover:text-blue-600
                     transition duration-200 ease-in-out transform hover:scale-105"
            >
              Sign Out
            </button>
          </nav>
        </div>
        <!-- END INLINED NAVBAR -->

        <!-- Department Specific Content (conditionally displayed by activeSection) -->
        <!-- This section is for dynamic components like IT/Finance dashboard -->
        <div
          class="mt-8 p-4 bg-gray-100 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          *ngIf="activeSection === 'overview'"
        >
          <h2 class="text-2xl font-bold text-custom-gradient mb-4">
            Department Specific Content
          </h2>
          <ng-container #departmentComponentHost></ng-container>
          <p
            *ngIf="
              userDepartment &&
              userDepartment.toLowerCase() !== 'it' &&
              userDepartment.toLowerCase() !== 'finance'
            "
            class="text-gray-500 mt-4"
          >
            No specific dashboard available for the "{{
              userDepartment | titlecase
            }}" department.
          </p>
          <p *ngIf="!userDepartment" class="text-gray-500 mt-4">
            Department information not available. No specific dashboard loaded.
          </p>
        </div>

        <!-- Your Customization & Account Details Grid (conditionally displayed by activeSection) -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-6 text-base text-gray-600"
          *ngIf="activeSection === 'overview'"
        >
          <div
            class="p-6 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-md"
          >
            <h3 class="font-semibold text-xl text-custom-gradient mb-3">
              Your Customization
            </h3>
            <p class="text-gray-700 mb-2">
              <strong class="font-bold">User Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.userAnalytics,
                  'text-red-600 font-semibold': !customization.userAnalytics
                }"
                class="ml-2"
                >{{
                  customization.userAnalytics ? 'Enabled' : 'Disabled'
                }}</span
              >
            </p>
            <p class="text-gray-700 mb-2">
              <strong class="font-bold">Org Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.orgAnalytics,
                  'text-red-600 font-semibold': !customization.orgAnalytics
                }"
                class="ml-2"
                >{{ customization.orgAnalytics ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
            <p class="text-gray-700">
              <strong class="font-bold">Audit Log:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.auditLog,
                  'text-red-600 font-semibold': !customization.auditLog
                }"
                class="ml-2"
                >{{ customization.auditLog ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
          </div>
          <div
            class="p-6 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-md"
          >
            <h3 class="font-semibold text-xl text-custom-gradient mb-3">
              Account Details
            </h3>
            <p class="text-gray-700 mb-2">
              <strong class="font-bold">Organization ID:</strong>
              <span class="font-normal text-gray-800 break-words ml-2">{{
                orgId || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-700 mb-2">
              <strong class="font-bold">User ID:</strong>
              <span class="font-normal text-gray-800 break-words ml-2">{{
                uid || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-700 mb-2">
              <strong class="font-bold">Domain ID:</strong>
              <span class="font-normal text-gray-800 break-words ml-2">{{
                domainUid || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-700">
              <strong class="font-bold">Email:</strong>
              <span class="font-normal text-gray-800 break-words ml-2">{{
                userEmail || 'N/A'
              }}</span>
            </p>
          </div>
        </div>
        <!-- Role-specific feature sections (conditionally displayed by activeSection) -->
        <div class="space-y-10 pt-6">
          <div
            *ngIf="role === 'root' && activeSection === 'root'"
            class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-8 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <h2 class="text-2xl font-bold text-custom-gradient text-center">
              Root Administrator Features
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <app-create-admin [orgId]="orgId"></app-create-admin>
              <app-create-domain [orgId]="orgId"></app-create-domain>
            </div>
            <div
              class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            >
              <h3 class="text-xl font-semibold text-gray-700 mb-4">
                View All Tasks (Root Scope)
              </h3>
              <p class="text-gray-600">
                Root-level task overview would go here.
              </p>
            </div>
          </div>

          <div
            *ngIf="role === 'admin' && activeSection === 'admin'"
            class="p-8 shadow-md space-y-8 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <div class="space-y-6">
              <div
                class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <app-user-management></app-user-management>
              </div>
              <div
                class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <app-create-project
                  [orgId]="orgId"
                  [domainUid]="domainUid"
                ></app-create-project>
              </div>
              <div
                class="bg-white transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <h3 class="text-xl font-semibold text-gray-700 mb-4"></h3>
                <app-project-user-assigner></app-project-user-assigner>
              </div>
            </div>
          </div>

          <div
            *ngIf="role === 'user' && activeSection === 'user'"
            class="p-8 space-y-8 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <div
              class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            >
              <app-user-dashboard></app-user-dashboard>
            </div>
          </div>
        </div>

        <!-- NEW: Project Chat Section -->
        <div
          *ngIf="activeSection === 'projectChat'"
          class="flex flex-col lg:flex-row gap-6 mt-8 p-4 bg-gray-100 rounded-lg shadow-md border-2 border-gray-300 animate-slide-in-fade"
        >
          <!-- Left Column: Project Selection for Chat -->
          <section class="lg:w-1/2 p-4 ">
            <h3 class="text-xl font-bold text-center text-custom-gradient mb-4">
              Select Project for Chat
            </h3>

            <div class="mb-4">
              <input
                type="text"
                placeholder="Search projects by name..."
                [(ngModel)]="searchTermProjects"
                name="searchTermProjects"
                class="w-full p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
              />
            </div>

            <div class="overflow-y-auto max-h-96 custom-scrollbar rounded-lg border-2 border-gray-300 shadow-md">
              <table class="min-w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr class="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
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
                      <span *ngIf="selectedProjectForChat?.uid === project.uid" class="ml-2 text-blue-500 text-xs">(Active Chat)</span>
                    </td>
                    <td class="py-3 px-6 text-center">
                      <button
                        (click)="selectProjectForChat(project)"
                        [disabled]="selectedProjectForChat?.uid === project.uid"
                        [ngClass]="{'bg-blue-600 hover:bg-blue-700': selectedProjectForChat?.uid !== project.uid, 'bg-gray-400 cursor-not-allowed': selectedProjectForChat?.uid === project.uid}"
                        class="text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                      >
                        {{ selectedProjectForChat?.uid === project.uid ? 'Selected' : 'View Chat' }}
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredProjects.length === 0">
                    <td colspan="2" class="py-4 text-center text-gray-500">
                      No projects found for your organization/domain.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Right Column: Project Chat Display -->
          <section *ngIf="selectedProjectForChat" class="lg:w-1/2 flex flex-col">
            <h3 class="text-xl font-bold text-center text-custom-gradient mb-4">
              Chat for: <span class="text-blue-600">{{ selectedProjectForChat.name }}</span>
              <button
                (click)="selectedProjectForChat = null"
                class="ml-4 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
              >
                (Clear Chat)
              </button>
            </h3>
            <div class="flex-grow">
              <app-project-chat
                [organizationId]="selectedProjectForChat.orgId"
                [domainUid]="selectedProjectForChat.domainUid"
                [projectId]="selectedProjectForChat.uid"
                [currentUserId]="uid"
                [currentUserEmail]="userEmail" 
              ></app-project-chat>
            </div>
          </section>

          <section *ngIf="!selectedProjectForChat && projectsList.length > 0" class="lg:w-1/2 p-6 rounded-xl shadow-lg border-2 border-gray-300 animate-slide-in-fade flex items-center justify-center">
              <p class="text-gray-500 text-lg text-center">Select a project from the left to view its chat.</p>
          </section>

          <section *ngIf="!selectedProjectForChat && projectsList.length === 0" class="lg:w-1/2 p-6 rounded-xl shadow-lg border-2 border-gray-300 animate-slide-in-fade flex items-center justify-center">
              <p class="text-gray-500 text-lg text-center">No projects found for your current context. Please create one or ensure your organization/domain is set.</p>
          </section>
        </div>


        <!-- New sections for Analytics and Audit Log content -->
        <div
          *ngIf="activeSection === 'userAnalytics'"
          class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-4 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <div class="flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mr-4 h-8 w-8 text-yellow-500"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 class="text-2xl font-bold text-custom-gradient text-center">
              User Analytics Dashboard
            </h2>
          </div>

          <app-user-lookup></app-user-lookup>
        </div>

        <div
          *ngIf="activeSection === 'auditLog'"
          class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-4 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <h2 class="text-2xl font-bold text-custom-gradient text-center">
            Audit Log
          </h2>
          <app-audit-log-viewer></app-audit-log-viewer>
        </div>

        <div
          *ngIf="activeSection === 'signOut'"
          class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-4 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <h2 class="text-2xl font-bold text-custom-gradient text-center">
            Sign Out
          </h2>
          <app-sign-out-button></app-sign-out-button>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  role: string | null = '';
  domainUid: string | null = '';
  userDepartment: string | null = '';
  userEmail: string | null = '';
  uid: string | null = ''; // User ID for chat sender
  orgId: string | null = '';

  activeSection: string = 'overview'; // Initial active section

  customization: {
    userAnalytics: boolean;
    orgAnalytics: boolean;
    auditLog: boolean;
  } = { userAnalytics: false, orgAnalytics: false, auditLog: false };


  // NEW: Project and Chat related properties
  projectsList: ProjectDocument[] = [];
  searchTermProjects: string = '';
  selectedProjectForChat: ProjectDocument | null = null;


  @ViewChild('departmentComponentHost', { read: ViewContainerRef })
  departmentComponentHost!: ViewContainerRef;

  private currentDynamicComponentRef: ComponentRef<any> | null = null;

  constructor(private firestore: Firestore) {} // Inject Firestore

  async ngOnInit(): Promise<void> { // Made ngOnInit async
    this.role = localStorage.getItem('userRole');
    const customizationStr = localStorage.getItem('customization');
    if (customizationStr) {
      try {
        this.customization = JSON.parse(customizationStr);
      } catch (e) {
        console.error('Error parsing customization from localStorage:', e);
        this.customization = {
          userAnalytics: false,
          orgAnalytics: false,
          auditLog: false,
        };
      }
    }
    this.orgId = localStorage.getItem('orgId');
    this.uid = localStorage.getItem('uid'); // Retrieve user UID for chat
    this.domainUid = localStorage.getItem('domainUid');
    this.userEmail = localStorage.getItem('useremail'); // Retrieve user email for chat
    this.userDepartment = localStorage.getItem('userDepartment');

    // Set initial active section based on role
    // I've removed the direct role-based activeSection setting here
    // to allow 'overview' or 'projectChat' to be the default.
    // If you want a specific role to default to its section, re-add that logic.
    this.activeSection = 'overview'; // Default to overview

    // Fetch projects and auto-select the first one if available
    // This will ensure chat is visible immediately if there are projects
    if (this.orgId && this.domainUid) {
      await this.fetchProjects(); // Await project fetching
      if (this.projectsList.length > 0) {
        this.selectProjectForChat(this.projectsList[0]);
        this.activeSection = 'projectChat'; // Automatically switch to chat section
      } else {
        // If no projects, default to overview or show a message
        this.activeSection = 'overview';
      }
    } else {
      console.warn('DashboardComponent: Missing organization or domain ID. Cannot fetch projects or load chat.');
      // Keep activeSection as 'overview' if org/domain are missing
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit triggered.');
    console.log(
      'Value of this.departmentComponentHost at ngAfterViewInit:',
      this.departmentComponentHost
    );

    // Only load department specific component if the 'overview' section is active initially
    if (this.departmentComponentHost && this.activeSection === 'overview') {
      console.log(
        'departmentComponentHost IS defined. Proceeding to load component.'
      );
      this.loadDepartmentSpecificComponent();
    } else if (!this.departmentComponentHost) {
      console.error(
        'ERROR: departmentComponentHost is UNDEFINED in ngAfterViewInit. ' +
          'Please double-check the #departmentComponentHost in the template and the @ViewChild selector.'
      );
    }
  }

  loadComponent(componentType: Type<any>): void {
    if (!this.departmentComponentHost) {
      console.error(
        'loadComponent called but departmentComponentHost is undefined!'
      );
      return;
    }

    if (this.currentDynamicComponentRef) {
      this.currentDynamicComponentRef.destroy();
      this.currentDynamicComponentRef = null;
    }
    this.departmentComponentHost.clear();

    this.currentDynamicComponentRef =
      this.departmentComponentHost.createComponent(componentType);

    // Pass inputs to dynamically loaded components
    if (this.currentDynamicComponentRef.instance.userName !== undefined) {
      this.currentDynamicComponentRef.instance.userName = this.userEmail || '';
    }
    if (this.currentDynamicComponentRef.instance.userRole !== undefined) {
      this.currentDynamicComponentRef.instance.userRole = this.role || '';
    }
    if (this.currentDynamicComponentRef.instance.userDepartment !== undefined) {
      this.currentDynamicComponentRef.instance.userDepartment =
        this.userDepartment || '';
    }
    if (this.currentDynamicComponentRef.instance.orgId !== undefined) { // Pass orgId
      this.currentDynamicComponentRef.instance.orgId = this.orgId || '';
    }
    if (this.currentDynamicComponentRef.instance.domainUid !== undefined) { // Pass domainUid
      this.currentDynamicComponentRef.instance.domainUid = this.domainUid || '';
    }
    if (this.currentDynamicComponentRef.instance.uid !== undefined) { // Pass uid
      this.currentDynamicComponentRef.instance.uid = this.uid || '';
    }

    console.log(`${componentType.name} loaded dynamically.`);
  }

  unloadDynamicComponent(): void {
    if (this.currentDynamicComponentRef) {
      this.currentDynamicComponentRef.destroy();
      this.currentDynamicComponentRef = null;
      if (this.departmentComponentHost) {
        this.departmentComponentHost.clear();
      }
      console.log('Dynamic component unloaded.');
    }
  }

  loadDepartmentSpecificComponent(): void {
    console.log(
      'loadDepartmentSpecificComponent called. Raw userDepartment:',
      this.userDepartment
    );
    const department = this.userDepartment?.toLowerCase();

    if (department === 'it') {
      console.log('Loading IT Dashboard Component.');
      this.loadComponent(ItDashboardComponent);
    } else if (department === 'finance') {
      console.log('Loading Finance Dashboard Component.');
      this.loadComponent(FinanceDashboardComponent);
    } else {
      console.log(
        'No specific component to load for department:',
        this.userDepartment
      );
      this.unloadDynamicComponent();
    }
  }

  // New method to handle navigation from the navbar
  onNavigateToSection(section: string): void {
    this.activeSection = section;
    console.log('Navigated to section:', this.activeSection);

    // Unload any previously loaded dynamic component
    this.unloadDynamicComponent();

    // If navigating to 'overview', ensure department-specific content is loaded
    if (this.activeSection === 'overview') {
      // Small delay to ensure view is rendered before attempting to load dynamic component
      setTimeout(() => {
        if (this.departmentComponentHost) {
          this.loadDepartmentSpecificComponent();
        }
      }, 0);
    }
    // No specific dynamic component loading for analytics/audit log/projectChat sections,
    // their content is handled by *ngIf in the template directly.
  }

  // NEW: Project fetching and selection for chat
  async fetchProjects(): Promise<void> {
    if (!this.orgId || !this.domainUid) {
      this.projectsList = [];
      console.warn('DashboardComponent: Cannot fetch projects, organization ID or domain ID is missing.');
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
      console.error('DashboardComponent: Error fetching projects:', error);
      // Implement a user-facing error message here
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

  selectProjectForChat(project: ProjectDocument): void {
    this.selectedProjectForChat = project;
    // The ProjectChatComponent will automatically update via ngOnChanges
  }
}
