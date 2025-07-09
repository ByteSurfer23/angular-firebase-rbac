// src/app/domain-components/it-dashboard.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-it-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-green-700 text-white rounded-lg shadow-md mt-4">
      <h2 class="text-2xl font-bold mb-2">Welcome to the IT Department Dashboard!</h2>
      <p class="text-lg">This content is specific to the IT domain.</p>
      <p *ngIf="domainNameInput" class="text-sm mt-2">Domain Name: {{ domainNameInput }}</p>
      <p *ngIf="orgIdInput" class="text-sm">Organization ID: {{ orgIdInput }}</p>
      <p *ngIf="domainUidInput" class="text-sm">Domain UID: {{ domainUidInput }}</p>
    </div>
  `
})
export class ItDashboardComponent implements OnInit {
  @Input() domainNameInput!: string;
  @Input() orgIdInput!: string;
  @Input() domainUidInput!: string;

  ngOnInit(): void {
    console.log(`ItDashboardComponent loaded for ${this.domainNameInput} (Org: ${this.orgIdInput}, DomainUID: ${this.domainUidInput})`);
  }
}