import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="text-center bg-white p-6 rounded-lg shadow-md">
        <h1 class="text-2xl font-semibold text-gray-800">Welcome to the Dashboard</h1>
        <p class="mt-4 text-lg text-gray-600">Your role: <strong>{{ role }}</strong></p>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  role: string | null = '';

  ngOnInit() {
    this.role = localStorage.getItem('userRole');
  }
} 
