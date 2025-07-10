// src/app/domain-components/it-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common'; // Ensure NgIf is imported

@Component({
  selector: 'app-it-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf], // Add NgIf to imports
  template: `
    <div class="text-gray-800 font-poppins p-4 sm:p-6 verflow-hidden">
      <div class="p-6 text-gray-800 mt-4 border-gray-300 animate-slide-in-fade">
        <h2 class="text-3xl font-extrabold text-custom-gradient mb-4 flex items-center">
          Welcome to the IT Department Dashboard!
        </h2>
        <p class="text-lg text-gray-700">This content is specific to the IT domain.</p>
        <p *ngIf="domainNameInput" class="text-md mt-3 text-gray-600">
          Domain Name: <span class="font-semibold text-blue-600">{{ domainNameInput }}</span>
        </p>
        <p *ngIf="orgIdInput" class="text-md text-gray-600">
          Organization ID: <span class="font-semibold text-pink-600">{{ orgIdInput }}</span>
        </p>
        <p *ngIf="domainUidInput" class="text-md text-gray-600">
          Domain UID: <span class="font-semibold text-gray-700">{{ domainUidInput }}</span>
        </p>
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
export class ItDashboardComponent implements OnInit {
  role: string | null = '';
  domainNameInput: string | null = '';
  userDepartment: string | null = '';
  userEmail: string | null = '';
  domainUidInput : string | null = '';
  orgIdInput: string | null = '';

  ngOnInit(): void {
    this.orgIdInput = localStorage.getItem('orgId');
    this.domainUidInput = localStorage.getItem('domainUid');
    this.userEmail = localStorage.getItem('useremail');
    this.domainNameInput = localStorage.getItem('userDepartment');
    console.log(`ItDashboardComponent loaded for ${this.domainNameInput} (Org: ${this.orgIdInput}, DomainUID: ${this.domainUidInput})`);
  }
}
