// src/app/dashboard/dashboard.component.ts

import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  Type,
  AfterViewInit, // Make sure AfterViewInit is imported
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
// EventEmitter import is not used here, can be removed if not needed elsewhere
// import { EventEmitter } from '@angular/core';

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
  ],
  template: `
    <div class="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 font-inter">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      </style>

      <div
        class="max-w-8xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg space-y-8 border border-gray-700"
      >
        <div class="text-center pb-4 border-b border-gray-700">
          <h1 class="text-4xl font-extrabold text-gray-100">
            Welcome to the Dashboard
          </h1>
          <p class="mt-3 text-lg text-gray-300">
            Your role:
            <strong class="text-blue-400">{{ role | titlecase }}</strong>
            <span *ngIf="userDepartment">
              | Department:
              <strong class="text-purple-400">{{
                userDepartment | titlecase
              }}</strong>
            </span>
          </p>
        </div>

        <div
          class="mt-8 p-4 bg-gray-900 rounded-xl shadow-inner border border-gray-700"
        >
          <h2 class="text-xl font-bold text-gray-100 mb-4">
            Department Specific Content
          </h2>
          <ng-container #departmentComponentHost></ng-container>
          <p
            *ngIf="
              userDepartment &&
              userDepartment.toLowerCase() !== 'it' &&
              userDepartment.toLowerCase() !== 'finance'
            "
            class="text-gray-400 mt-4"
          >
            No specific dashboard available for the "{{
              userDepartment | titlecase
            }}" department.
          </p>
          <p *ngIf="!userDepartment" class="text-gray-400 mt-4">
            Department information not available. No specific dashboard loaded.
          </p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-gray-300"
        >
          <div
            class="p-5 bg-gray-900 rounded-lg border border-gray-700 shadow-sm"
          >
            <h3 class="font-semibold text-gray-100 mb-2">Your Customization</h3>
            <p>
              <strong>User Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-400': customization.userAnalytics,
                  'text-red-400': !customization.userAnalytics
                }"
                >{{
                  customization.userAnalytics ? 'Enabled' : 'Disabled'
                }}</span
              >
            </p>
            <p>
              <strong>Org Analytics:</strong>
              <span
                [ngClass]="{
                  'text-green-400': customization.orgAnalytics,
                  'text-red-400': !customization.orgAnalytics
                }"
                >{{ customization.orgAnalytics ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
            <p>
              <strong>Audit Log:</strong>
              <span
                [ngClass]="{
                  'text-green-400': customization.auditLog,
                  'text-red-400': !customization.auditLog
                }"
                >{{ customization.auditLog ? 'Enabled' : 'Disabled' }}</span
              >
            </p>
          </div>
          <div
            class="p-5 bg-gray-900 rounded-lg border border-gray-700 shadow-sm"
          >
            <h3 class="font-semibold text-gray-100 mb-2">Account Details</h3>
            <p>
              <strong>Organization ID:</strong>
              <span class="font-medium text-gray-200 break-words">{{
                orgId || 'N/A'
              }}</span>
            </p>
            <p>
              <strong>User ID:</strong>
              <span class="font-medium text-gray-200 break-words">{{
                uid || 'N/A'
              }}</span>
            </p>
            <p>
              <strong>Domain ID:</strong>
              <span class="font-medium text-gray-200 break-words">{{
                domainUid || 'N/A'
              }}</span>
            </p>
            <p>
              <strong>Email:</strong>
              <span class="font-medium text-gray-200 break-words">{{
                userEmail || 'N/A'
              }}</span>
            </p>
          </div>
          <div
            class="p-5 bg-gray-900 rounded-lg border border-gray-700 shadow-sm flex items-center justify-center"
          >
            <app-custom-buttons
              [customization]="customization"
            ></app-custom-buttons>
          </div>
        </div>


        <div class="space-y-10 pt-6">
          <div
            *ngIf="role === 'root'"
            class="p-8 bg-blue-900 rounded-xl border border-blue-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-blue-400 text-center">
              Root Administrator Features
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700"
              >
                <h3 class="text-xl font-semibold text-blue-300 mb-4">
                  Manage Admins
                </h3>
                <app-create-admin [orgId]="orgId"></app-create-admin>
              </div>
              <div
                class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700"
              >
                <h3 class="text-xl font-semibold text-blue-300 mb-4">
                  Manage Domains
                </h3>
                <app-create-domain [orgId]="orgId"></app-create-domain>
              </div>
            </div>
            <div
              class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700"
            >
              <h3 class="text-xl font-semibold text-blue-300 mb-4">
                View All Tasks (Root Scope)
              </h3>
              <p class="text-gray-300">
                Root-level task overview would go here.
              </p>
            </div>
          </div>

          <div
            *ngIf="role === 'admin'"
            class="p-8 bg-green-900 rounded-xl border border-green-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-green-400 text-center">
              Domain Administrator Features
            </h2>
            <div class="space-y-6">
              <div
                class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700"
              >
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Manage Users
                </h3>
                <app-user-management></app-user-management>
              </div>
              <div
                class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700"
              >
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Manage Projects & Tasks
                </h3>
                <app-create-project
                  [orgId]="orgId"
                  [domainUid]="domainUid"
                ></app-create-project>
              </div>
              <div
                class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700"
              >
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Assign Users to Projects & Assets
                </h3>
                <app-project-user-assigner></app-project-user-assigner>
              </div>
            </div>
          </div>

          <div
            *ngIf="role === 'user'"
            class="p-8 bg-yellow-900 rounded-xl border border-yellow-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-yellow-400 text-center">
              Your Assigned Tasks
            </h2>
            <div
              class="bg-yellow-800 p-6 rounded-lg shadow-inner border border-yellow-700"
            >
              <app-user-dashboard></app-user-dashboard>
            </div>
          </div>
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
  // Removed domainName as it's not being used and domainService is not injected.
  // domainName: string | null = null;


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

  constructor() {} // Removed domainService injection as it was commented out/not provided

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

    // DO NOT CALL loadDepartmentSpecificComponent() here.
    // It will be called in ngAfterViewInit.
  }

  ngAfterViewInit(): void {
    // IMPORTANT: Check if departmentComponentHost is defined before using it
    console.log('ngAfterViewInit triggered.');
    console.log('Value of this.departmentComponentHost at ngAfterViewInit:', this.departmentComponentHost);

    if (this.departmentComponentHost) {
      console.log('departmentComponentHost IS defined. Proceeding to load component.');
      this.loadDepartmentSpecificComponent();
    } else {
      console.error(
        'ERROR: departmentComponentHost is UNDEFINED in ngAfterViewInit. ' +
        'Please double-check the #departmentComponentHost in the template and the @ViewChild selector.'
      );
    }
  }

  loadComponent(componentType: Type<any>): void {
    // Add a safety check here too, in case loadComponent is called unexpectedly early
    if (!this.departmentComponentHost) {
      console.error('loadComponent called but departmentComponentHost is undefined!');
      return; // Prevent the TypeError
    }

    if (this.currentDynamicComponentRef) {
      this.currentDynamicComponentRef.destroy();
      this.currentDynamicComponentRef = null;
    }
    this.departmentComponentHost.clear();

    this.currentDynamicComponentRef =
      this.departmentComponentHost.createComponent(componentType);

    // Pass data to the dynamically created component if it has these inputs
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
      // Only clear if departmentComponentHost is defined, to prevent error on unload if it was never loaded
      if (this.departmentComponentHost) {
        this.departmentComponentHost.clear();
      }
      console.log('Dynamic component unloaded.');
    }
  }

  loadDepartmentSpecificComponent(): void {
    console.log('loadDepartmentSpecificComponent called. Raw userDepartment:', this.userDepartment);
    const department = this.userDepartment?.toLowerCase(); // Convert to lowercase for comparison
    console.log('Normalized department for comparison:', department);

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
}