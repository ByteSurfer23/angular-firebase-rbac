import { Component, OnInit } from '@angular/core';
import {
  CreateUserComponent,
  CreateAdminComponent,
} from '../user-admin/user-admin';
import { NgIf } from '@angular/common';
import { TaskListComponent } from '../task-list/task-list';
import { TaskFormComponent } from '../task-form/task-form';
import { UpdateTaskStatusComponent } from '../update-task-status/update-task-status';
@Component({
  selector: 'app-dashboard',

  template: `<div class="min-h-screen bg-gray-100 py-10 px-4">
    <div class="max-w-8xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-8">
      <!-- Dashboard Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800">
          Welcome to the Dashboard
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Your role: <strong class="text-blue-600">{{ role }}</strong>
        </p>
      </div>

      <!-- Customization Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        <div class="p-4 bg-gray-50 rounded-md border">
          <p>
            <strong>User Analytics:</strong> {{ customization.userAnalytics }}
          </p>
          <p>
            <strong>Org Analytics:</strong> {{ customization.orgAnalytics }}
          </p>
          <p><strong>Audit Log:</strong> {{ customization.auditLog }}</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-md border">
          <p><strong>Organization ID:</strong> {{ orgId }}</p>
          <p><strong>User ID:</strong> {{ uid }}</p>
        </div>
      </div>

      <!-- Feature Section -->
      <div class="space-y-8">
        <!-- Root Features -->
        <div
          *ngIf="role === 'root'"
          class="p-6 bg-blue-50 rounded-lg border border-blue-200 space-y-6"
        >
          <h2 class="text-xl font-semibold text-blue-800">Root Features</h2>
          <div class="flex justify-around">
            <app-create-user [orgId]="orgId"></app-create-user>
            <app-create-admin [orgId]="orgId"></app-create-admin>
          </div>

          <app-task-list [orgId]="orgId"></app-task-list>
        </div>

        <!-- Admin Features -->
        <div
          *ngIf="role === 'admin'"
          class="p-6 bg-green-50 rounded-lg border border-green-200 space-y-6"
        >
          <h2 class="text-xl font-semibold text-green-800">Admin Features</h2>
          <app-task-form [orgId]="orgId"></app-task-form>
          <app-task-list [orgId]="orgId"></app-task-list>
        </div>

        <!-- User Features -->
        <div
          *ngIf="role === 'user'"
          class="p-6 bg-yellow-50 rounded-lg border border-yellow-200 space-y-6"
        >
          <h2 class="text-xl font-semibold text-yellow-800">Your Tasks</h2>
          <app-update-task-status
            [orgId]="orgId"
            [userId]="uid"
          ></app-update-task-status>
        </div>
      </div>
    </div>
  </div> `,
  imports: [
    CreateUserComponent,
    NgIf,
    CreateAdminComponent,
    TaskListComponent,
    TaskFormComponent,
    UpdateTaskStatusComponent,
  ],
})
export class DashboardComponent implements OnInit {
  role: string | null = '';
  customization: {
    userAnalytics: boolean;
    orgAnalytics: boolean;
    auditLog: boolean;
  } = { userAnalytics: false, orgAnalytics: false, auditLog: false };
  orgId: string | null = '';
  uid: string | null = '';
  ngOnInit() {
    this.role = localStorage.getItem('userRole');
    const customizationStr = localStorage.getItem('customization');
    if (customizationStr) {
      this.customization = JSON.parse(customizationStr);
    }
    this.orgId = localStorage.getItem('orgId');
    this.uid = localStorage.getItem('uid');
  }
}
