// src/app/dashboard/dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CreateAdminComponent } from '../create-admin/create-admin';
import { CreateDomainComponent } from '../create-domain/create-domain';
import { CommonModule, NgIf } from '@angular/common'; // CommonModule is correctly imported her
import { CustomButtonsComponent } from '../routechanger/routechanger';
import { CreateProjectComponent } from '../domain-admin-basics/domain-admin-basics'; // Assuming this path is correct for your 'Project & Task Management' component
import { UserManagementComponent } from '../domain-admin-usercrud/domain-admin-usercrud';
import { ProjectUserAssignerComponent } from '../assignuserproject/assignuserproject'; // Original path
import { UserDashboardComponent } from "../userpanel/userpanel";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf,
    CustomButtonsComponent,
    CreateDomainComponent,
    CreateAdminComponent,
    CreateProjectComponent, // This component now handles project & task management
    UserManagementComponent,
    CommonModule, // This provides DatePipe to all components within this module's scope
    ProjectUserAssignerComponent,
    UserDashboardComponent
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
        <!-- Dashboard Header -->
        <div class="text-center pb-4 border-b border-gray-700">
          <h1 class="text-4xl font-extrabold text-gray-100">
            Welcome to the Dashboard
          </h1>
          <p class="mt-3 text-lg text-gray-300">
            Your role:
            <strong class="text-blue-400">{{ role | titlecase }}</strong>
          </p>
        </div>

        <!-- Customization Info -->
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
          </div>
          <div
            class="p-5 bg-gray-900 rounded-lg border border-gray-700 shadow-sm flex items-center justify-center"
          >
            <app-custom-buttons
              [customization]="customization"
            ></app-custom-buttons>
          </div>
        </div>

        <!-- Feature Sections based on Role -->
        <div class="space-y-10 pt-6">
          <!-- Root Features -->
          <div
            *ngIf="role === 'root'"
            class="p-8 bg-blue-900 rounded-xl border border-blue-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-blue-400 text-center">
              Root Administrator Features
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700">
                <h3 class="text-xl font-semibold text-blue-300 mb-4">
                  Manage Admins
                </h3>
                <app-create-admin [orgId]="orgId"></app-create-admin>
              </div>
              <div class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700">
                <h3 class="text-xl font-semibold text-blue-300 mb-4">
                  Manage Domains
                </h3>
                <app-create-domain [orgId]="orgId"></app-create-domain>
              </div>
            </div>
            <div class="bg-blue-800 p-6 rounded-lg shadow-inner border border-blue-700">
              <h3 class="text-xl font-semibold text-blue-300 mb-4">
                View All Tasks (Root Scope)
              </h3>
              <!-- TaskListComponent removed, consider adding a root-level task view if needed -->
            </div>
          </div>

          <!-- Admin Features -->
          <div
            *ngIf="role === 'admin'"
            class="p-8 bg-green-900 rounded-xl border border-green-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-green-400 text-center">
              Domain Administrator Features
            </h2>
            <div class="space-y-6">
              <div class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700">
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Manage Users
                </h3>
                <app-user-management></app-user-management>
              </div>
              <div class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700">
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Manage Projects & Tasks
                </h3>
                <!-- Pass orgId and domainUid to the Project & Task Management component -->
                <app-create-project
                  [orgId]="orgId"
                  [domainUid]="domainUid"
                ></app-create-project>
              </div>
              <div class="bg-green-800 p-6 rounded-lg shadow-inner border border-green-700">
                <h3 class="text-xl font-semibold text-green-300 mb-4">
                  Assign Users to Projects & Assets
                </h3>
                <app-project-user-assigner></app-project-user-assigner>
              </div>
            </div>
          </div>

          <!-- User Features -->
          <div
            *ngIf="role === 'user'"
            class="p-8 bg-yellow-900 rounded-xl border border-yellow-700 shadow-md space-y-8"
          >
            <h2 class="text-2xl font-bold text-yellow-400 text-center">
              Your Assigned Tasks
            </h2>
            <div class="bg-yellow-800 p-6 rounded-lg shadow-inner border border-yellow-700">
              <app-user-dashboard></app-user-dashboard>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  role: string | null = '';
  domainUid: string | null = '';
  customization: {
    userAnalytics: boolean;
    orgAnalytics: boolean;
    auditLog: boolean;
  } = { userAnalytics: false, orgAnalytics: false, auditLog: false };
  orgId: string | null = '';
  uid: string | null = '';

  constructor() {}

  ngOnInit() {
    this.role = localStorage.getItem('userRole');
    const customizationStr = localStorage.getItem('customization');
    if (customizationStr) {
      try {
        this.customization = JSON.parse(customizationStr);
      } catch (e) {
        console.error('Error parsing customization from localStorage:', e);
        // Fallback to default if parsing fails
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
  }
}
