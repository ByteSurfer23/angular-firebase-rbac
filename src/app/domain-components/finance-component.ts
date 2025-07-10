// src/app/finance-dashboard/finance-dashboard.component.ts

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgIf, TitleCasePipe } from '@angular/common'; // Include NgIf and TitleCasePipe

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, TitleCasePipe], // Ensure NgIf and TitleCasePipe are imported
  template: `
    <div class="min-h-screen bg-gray-50 text-gray-800 font-poppins p-4 sm:p-6 rounded-xl overflow-hidden">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; }

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

      <div class="bg-white p-6 rounded-xl shadow-xl border-2 border-gray-300 text-gray-800 font-poppins animate-slide-in-fade">
        <h3 class="text-3xl font-extrabold text-custom-gradient mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 h-8 w-8 text-yellow-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m15 9-3 3-3-3"/><path d="M12 12V3"/>
          </svg>
          Finance Department Dashboard
        </h3>
        <p class="text-gray-700 mb-4">
          Welcome, <span class="font-semibold text-blue-600">{{ userName || 'Guest' }}</span>! Here's your personalized finance overview.
        </p>

        <!-- Messages (Error/Success) -->
        <div *ngIf="message" class="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-4 shadow-md">
          <span class="block sm:inline font-medium">{{ message }}</span>
          <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-green-600 hover:text-green-800" (click)="message = ''">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
            </svg>
          </button>
        </div>

        <div *ngIf="errorMessage" class="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-4 shadow-md">
          <span class="block sm:inline font-medium">{{ errorMessage }}</span>
          <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer text-red-600 hover:text-red-800" (click)="errorMessage = ''">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
            </svg>
          </button>
        </div>

        <h4 class="text-xl font-semibold text-blue-600 mt-6 mb-3">Your Access:</h4>

        <ul class="list-disc list-inside space-y-2 text-gray-700 p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
          <li class="hover:text-gray-900 transition duration-150 ease-in-out">Budget Reports Access</li>
          <li class="hover:text-gray-900 transition duration-150 ease-in-out">Financial Projections</li>

          <li *ngIf="userRole === 'admin' || hasPermission('approve_expenses')" class="text-yellow-700 font-medium hover:text-yellow-900 transition duration-150 ease-in-out">Expense Approval Queue (Admin/Manager Access)</li>
          <li *ngIf="userRole === 'root' || hasPermission('full_financial_control')" class="text-red-700 font-medium hover:text-red-900 transition duration-150 ease-in-out">Full Financial Control (Root Access)</li>

          <li class="hover:text-gray-900 transition duration-150 ease-in-out">Submit Reimbursement Request</li>
        </ul>

        <div class="mt-6 p-4 bg-gray-50 rounded-md border-2 border-gray-200 shadow-sm">
          <p class="text-gray-600 text-sm mb-1">Your detected role: <span class="font-semibold text-blue-600">{{ userRole | titlecase }}</span></p>
          <p *ngIf="userDepartment" class="text-gray-600 text-sm mb-1">Department: <span class="font-semibold text-pink-600">{{ userDepartment | titlecase }}</span></p>
          <p *ngIf="financePermissions.length > 0" class="text-gray-600 text-sm">Specific Permissions: <span class="font-semibold text-gray-700">{{ financePermissions.join(', ') }}</span></p>
          <p *ngIf="financePermissions.length === 0 && userDepartment === 'Finance'" class="text-gray-600 text-sm">No specific finance permissions assigned beyond standard department access.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Google Font: Poppins */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
    body { font-family: 'Poppins', sans-serif; }

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
  `]
})
export class FinanceDashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  userDepartment: string = '';
  financePermissions: string[] = [];
  message: string | null = null;
  errorMessage: string | null = null;

  @Output() closed = new EventEmitter<void>();

  ngOnInit(): void {
    // Retrieve data from localStorage
    this.userName = localStorage.getItem('useremail') || 'Guest'; // Assuming useremail is used as name
    this.userRole = localStorage.getItem('userRole') || '';
    this.userDepartment = localStorage.getItem('userDepartment') || '';

    const permissionsString = localStorage.getItem('customization');
    if (permissionsString) {
      try {
        const customization = JSON.parse(permissionsString);
        // Assuming financePermissions are directly under customization or a specific key
        // Adjust this logic based on your actual customization structure
        if (customization && customization.financePermissions && Array.isArray(customization.financePermissions)) {
          this.financePermissions = customization.financePermissions;
        } else if (customization && customization.permissions && Array.isArray(customization.permissions)) {
          // Fallback if permissions are generic and need filtering
          this.financePermissions = customization.permissions.filter((p: string) => p.startsWith('finance_'));
        }
      } catch (e) {
        console.error("Error parsing customization from localStorage", e);
        this.errorMessage = "Failed to load user permissions.";
      }
    }

    console.log(`FinanceDashboardComponent loaded for ${this.userName} (Role: ${this.userRole}, Dept: ${this.userDepartment}, Permissions: ${this.financePermissions.join(', ')})`);
  }

  closeComponent() {
    this.closed.emit();
  }

  // Helper method to check if a permission exists
  hasPermission(permission: string): boolean {
    return this.financePermissions.includes(permission);
  }
}
