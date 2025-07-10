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
    ProjectUserAssignerComponent,
    UserDashboardComponent,
    UserLookupComponent,
    ItDashboardComponent,
    FinanceDashboardComponent,
    TitleCasePipe,
    Orgstats,
    AuditLogViewerComponent,
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
          </nav>
        </div>
        <!-- END INLINED NAVBAR -->

        <!-- Department Specific Content (conditionally displayed by activeSection) -->
        <div
          class="mt-8 p-4 bg-gray-100 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          *ngIf="activeSection === 'overview'"
        >
          <h2 class="text-xl font-bold text-gray-700 mb-4">
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
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-600"
          *ngIf="activeSection === 'overview'"
        >
          <div
            class="p-5 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <h3 class="font-semibold text-gray-700 mb-2">Your Customization</h3>
            <p class="text-gray-600">
              <strong class="font-medium">User Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.userAnalytics,
                  'text-red-600 font-semibold': !customization.userAnalytics
                }"
                >{{
                  customization.userAnalytics ? 'Enabled' : 'Disabled'
                }}</span
              >
            </p>
            <p class="text-gray-600">
              <strong class="font-medium">Org Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.orgAnalytics,
                  'text-red-600 font-semibold': !customization.orgAnalytics
                }"
                >{{ customization.orgAnalytics ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
            <p class="text-gray-600">
              <strong class="font-medium">Audit Log:</strong>
              <span
                [ngClass]="{
                  'text-green-600 font-semibold': customization.auditLog,
                  'text-red-600 font-semibold': !customization.auditLog
                }"
                >{{ customization.auditLog ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
          </div>
          <div
            class="p-5 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <h3 class="font-semibold text-gray-700 mb-2">Account Details</h3>
            <p class="text-gray-600">
              <strong class="font-medium">Organization ID:</strong>
              <span class="font-normal text-gray-700 break-words">{{
                orgId || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-600">
              <strong class="font-medium">User ID:</strong>
              <span class="font-normal text-gray-700 break-words">{{
                uid || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-600">
              <strong class="font-medium">Domain ID:</strong>
              <span class="font-normal text-gray-700 break-words">{{
                domainUid || 'N/A'
              }}</span>
            </p>
            <p class="text-gray-600">
              <strong class="font-medium">Email:</strong>
              <span class="font-normal text-gray-700 break-words">{{
                userEmail || 'N/A'
              }}</span>
            </p>
          </div>
          <div
            class="p-5 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-sm flex items-center justify-center transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <app-custom-buttons
              [customization]="customization"
            ></app-custom-buttons>
          </div>
        </div>

        <section
          *ngIf="customization.userAnalytics && activeSection === 'overview'"
          class="mt-8"
        >
          <app-user-lookup></app-user-lookup>
        </section>

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
            class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-8 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <h2 class="text-2xl font-bold text-custom-gradient text-center">
              Domain Administrator Features
            </h2>
            <div class="space-y-6">
              <div
                class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                  Manage Users
                </h3>
                <app-user-management></app-user-management>
              </div>
              <div
                class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                  Manage Projects & Tasks
                </h3>
                <app-create-project
                  [orgId]="orgId"
                  [domainUid]="domainUid"
                ></app-create-project>
              </div>
              <div
                class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              >
                <h3 class="text-xl font-semibold text-gray-700 mb-4">
                  Assign Users to Projects & Assets
                </h3>
                <app-project-user-assigner></app-project-user-assigner>
              </div>
            </div>
          </div>

          <div
            *ngIf="role === 'user' && activeSection === 'user'"
            class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-8 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
          >
            <h2 class="text-2xl font-bold text-custom-gradient text-center">
              Your Assigned Tasks
            </h2>
            <div
              class="bg-white p-6 rounded-lg shadow-inner border-2 border-gray-300 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            >
              <app-user-dashboard></app-user-dashboard>
            </div>
          </div>
        </div>

        <!-- New sections for Analytics and Audit Log content -->
        <div
          *ngIf="activeSection === 'userAnalytics'"
          class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-4 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <h2 class="text-2xl font-bold text-custom-gradient text-center">
            User Analytics Dashboard
          </h2>
          <app-user-lookup></app-user-lookup>
        </div>

        <div
          *ngIf="activeSection === 'orgAnalytics'"
          class="p-8 bg-gray-100 rounded-lg border-2 border-gray-300 shadow-md space-y-4 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <h2 class="text-2xl font-bold text-custom-gradient text-center">
            Organization Analytics Dashboard
          </h2>
          <app-task-analytics></app-task-analytics>
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
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  role: string | null = '';
  domainUid: string | null = '';
  userDepartment: string | null = '';
  userEmail: string | null = '';
  activeSection: string = 'overview'; // New state variable to control active section

  customization: {
    userAnalytics: boolean;
    orgAnalytics: boolean;
    auditLog: boolean;
  } = { userAnalytics: false, orgAnalytics: false, auditLog: false };
  orgId: string | null = '';
  uid: string | null = '';

  @ViewChild('departmentComponentHost', { read: ViewContainerRef })
  departmentComponentHost!: ViewContainerRef;

  private currentDynamicComponentRef: ComponentRef<any> | null = null;

  constructor() {}

  ngOnInit() {
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
    this.uid = localStorage.getItem('uid');
    this.domainUid = localStorage.getItem('domainUid');
    this.userEmail = localStorage.getItem('useremail');
    this.userDepartment = localStorage.getItem('userDepartment');

    // Set initial active section based on role
    if (this.role) {
      this.activeSection = this.role;
    } else {
      this.activeSection = 'overview';
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
    // No specific dynamic component loading for analytics/audit log sections,
    // their content is handled by *ngIf in the template directly.
  }
}
