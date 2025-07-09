// src/app/finance-dashboard/finance-dashboard.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-700 p-6 rounded-lg shadow-xl border border-gray-600 text-gray-100 font-inter">
      <h3 class="text-2xl font-bold text-blue-300 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 h-6 w-6 text-green-300">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m15 9-3 3-3-3"/><path d="M12 12V3"/>
        </svg>
        Finance Department Dashboard
      </h3>
      <p class="text-gray-300 mb-4">
        Welcome, <span class="font-semibold text-white">{{ userName || 'Guest' }}</span>! Here's your personalized finance overview.
      </p>

      <h4 class="text-xl font-semibold text-blue-400 mt-6 mb-3">Your Access:</h4>

      <ul class="list-disc list-inside space-y-2 text-gray-300">
        <li>Budget Reports Access</li>
        <li>Financial Projections</li>

        <li *ngIf="userRole === 'admin' || hasPermission('approve_expenses')" class="text-yellow-300 font-medium">Expense Approval Queue (Admin/Manager Access)</li>
        <li *ngIf="userRole === 'root' || hasPermission('full_financial_control')" class="text-red-300 font-medium">Full Financial Control (Root Access)</li>

        <li>Submit Reimbursement Request</li>
      </ul>

      <div class="mt-6 p-3 bg-gray-800 rounded-md border border-gray-600">
        <p class="text-gray-400 text-sm">Your detected role: <span class="font-semibold text-white">{{ userRole | titlecase }}</span></p>
        <p *ngIf="userDepartment" class="text-gray-400 text-sm">Department: <span class="font-semibold text-white">{{ userDepartment | titlecase }}</span></p>
        <p *ngIf="financePermissions.length > 0" class="text-gray-400 text-sm">Specific Permissions: <span class="font-semibold text-white">{{ financePermissions.join(', ') }}</span></p>
        <p *ngIf="financePermissions.length === 0 && userDepartment === 'Finance'" class="text-gray-400 text-sm">No specific finance permissions assigned beyond standard department access.</p>
      </div>
    </div>
  `,
})
export class FinanceDashboardComponent {
  @Input() userName: string = '';
  @Input() userRole: string = '';
  @Input() userDepartment: string = ''; // New Input for department
  @Input() financePermissions: string[] = []; // New Input for specific permissions

  @Output() closed = new EventEmitter<void>();

  closeComponent() {
    this.closed.emit();
  }

  // Helper method to check if a permission exists
  hasPermission(permission: string): boolean {
    return this.financePermissions.includes(permission);
  }
}