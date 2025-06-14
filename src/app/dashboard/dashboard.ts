import { Component, OnInit } from '@angular/core';
import { CreateUserComponent } from "../user-admin/user-admin";
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-dashboard',

  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="text-center bg-white p-6 rounded-lg shadow-md">
        <h1 class="text-2xl font-semibold text-gray-800">Welcome to the Dashboard</h1>
        <p class="mt-4 text-lg text-gray-600">Your role: <strong>{{ role }}</strong></p>
        <p>{{customization.userAnalytics}}</p>
        <p>{{customization.orgAnalytics}}</p>
        <p>{{customization.auditLog}}</p>
        <p>{{orgId}}</p>
        <p>{{uid}}</p>
        <app-create-user *ngIf="role === 'root'" [orgId] = "orgId"></app-create-user>
      </div>
    </div>
  `,
  imports: [CreateUserComponent , NgIf],
})

export class DashboardComponent implements OnInit {
  role: string | null = '';
  customization: {
    userAnalytics: boolean;
    orgAnalytics: boolean;
    auditLog: boolean;
  } = { userAnalytics: false, orgAnalytics: false, auditLog: false };
  orgId : string | null = "";
  uid : string | null ="";
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
