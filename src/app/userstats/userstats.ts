// src/app/user-productivity-analytics/user-productivity-analytics.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, query, where, doc, getDoc } from '@angular/fire/firestore';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import * as ChartDataLabels from 'chartjs-plugin-datalabels';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // Required for *ngIf, *ngFor in standalone components

// Register Chart.js components and plugins once
Chart.register(...registerables, ChartDataLabels);

// --- Interfaces for your data structures ---
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?(): Date;
}

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: FirestoreTimestamp | Date | string;
  customization?: {
    auditLog?: boolean;
    orgAnalytics?: boolean;
    userAnalytics?: boolean;
  };
  orgId?: string;
}

interface Task {
  assignedTo?: string[];
  createdAt?: FirestoreTimestamp | Date | string;
  enquiryDate?: FirestoreTimestamp | Date | string;
  reminderDate?: FirestoreTimestamp | Date | string;
  status?: 'pending' | 'in-progress' | 'completed';
  taskDetail?: string;
  updatedAt?: FirestoreTimestamp | Date | string;
}

@Component({
  selector: 'app-user-productivity-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // NgChartsModule is not used directly, as Chart.js is manually initialized.
  ],
  templateUrl: './userstats.html',
  styleUrls: ['./userstats.scss']
})
export class UserProductivityAnalyticsComponent implements OnInit, OnDestroy {

  public logHtmlState(...args: any[]): string { // Make it public for template access
  console.log('HTML State Debug:', ...args);
  return ''; // Must return a string for interpolation
}

  searchUserUidControl = new FormControl('');

  currentUser: User | null = null;
  currentUserTasks: Task[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private chartInstances: Chart[] = [];

  private userIdToNameMap: { [key: string]: string } = {
    "KwOHnPFUqkdzGwe1EUJHoGW7OFW2": "Alice Smith",
    "JPrwv9v1QOY7FikzecZZcCU7s2G2": "Bob Johnson",
    "uLddNu8LNqXdT4kIfVBVKm8z75k2": "Charlie Brown",
    "uzfmMMxN7gT7tEru6nj843S5Xrx2": "David Lee",
    "mVGeBxr3BeUQnEHU105Jj6fybNb2": "Eve Miller",
    "mTP9tGGVkHdPnECRItZtFxFC83J2": "Demo User One",
  };

  constructor(private firestore: Firestore, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log("[UserProductivityAnalyticsComponent] Component initialized.");
    this.searchUserUidControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(uid => {
      console.log(`[searchUserUidControl] Value changed: ${uid}`);
      if (uid && typeof uid === 'string' && uid.length >= 20) {
        this.searchUser(uid);
      } else {
        this.resetView();
      }
    });
  }

  ngOnDestroy(): void {
    console.log("[UserProductivityAnalyticsComponent] Component destroyed. Destroying charts.");
    this.destroyAllCharts();
  }

  private destroyAllCharts(): void {
    this.chartInstances.forEach(chart => {
      if (chart) {
        chart.destroy();
        console.log(`[destroyAllCharts] Destroyed chart with ID: ${chart.id}`);
      }
    });
    this.chartInstances = [];
  }

  private resetView(): void {
    console.log("[resetView] Resetting component view.");
    this.currentUser = null;
    this.currentUserTasks = [];
    this.errorMessage = null;
    this.destroyAllCharts();
  }

  public toDateObject(value: FirestoreTimestamp | Date | string | undefined): Date | undefined {
    if (!value) return undefined;

    if (value instanceof Date) { return value; }
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }
    if (typeof value === 'object' && value !== null && typeof (value as any).seconds === 'number') {
      return new Date((value as any).seconds * 1000 + ((value as any).nanoseconds || 0) / 1_000_000);
    }
    if (typeof value === 'string') {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) { return parsedDate; }
    }
    return undefined;
  }

  public getLocalDateString(date: Date | undefined): string {
    if (!date) return 'N/A';
    return [
      date.getFullYear(),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getDate().toString().padStart(2, '0')
    ].join('-');
  }

  async searchUser(uid: string): Promise<void> {
    console.log(`[searchUser] Starting search for UID: ${uid}`);
    this.isLoading = true;
    this.errorMessage = null;
    this.resetView(); // Ensure fresh state before new search

    const orgId = localStorage.getItem('orgId');
    console.log(`[searchUser] Retrieved orgId from localStorage: ${orgId}`);
    if (!orgId) {
      this.errorMessage = 'Organization ID not found in local storage. Please ensure it is set.';
      this.isLoading = false;
      console.error("[searchUser] Aborting: orgId not found.");
      return;
    }

    try {
      const userDocRef = doc(this.firestore, `organizations/${orgId}/users/${uid}`);
      console.log(`[searchUser] Fetching user doc from path: users/${uid}`);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        this.errorMessage = `User with UID: "${uid}" not found. Please check the UID.`;
        this.isLoading = false;
        console.warn(`[searchUser] User document for UID ${uid} does not exist.`);
        return;
      }
      this.currentUser = userSnap.data() as User;
      this.currentUser.uid = uid;
      console.log('User found:', this.currentUser);

      const tasksCollectionPath = `organizations/${orgId}/tasks`;
      console.log(`[searchUser] Fetching tasks from path: ${tasksCollectionPath} for assignedTo: ${uid}`);
      const tasksRef = collection(this.firestore, tasksCollectionPath);
      const q = query(tasksRef, where('assignedTo', 'array-contains', uid));
      const taskSnap = await getDocs(q);
      this.currentUserTasks = taskSnap.docs.map(doc => doc.data() as Task);

      console.log('Tasks fetched for user:', this.currentUserTasks.length, 'tasks:', this.currentUserTasks);

      this.isLoading = false;
      console.log(`[searchUser] isLoading set to false. currentUser is now: ${!!this.currentUser}`);
      this.cdr.detectChanges(); // Trigger Angular's change detection cycle

      // Wait a small amount before trying to get canvas elements
      setTimeout(() => {
        console.log("[searchUser] Attempting to draw charts after 100ms delay.");
        if (this.currentUserTasks.length > 0) {
          this.drawMyTaskStatusChart();
          this.drawMyTaskLoadChart();
          this.drawMyTaskCompletionRateChart();
          this.drawMyOverdueTasksChart();
        } else {
          console.warn(`[searchUser] No tasks found for user ${uid} in organization ${orgId}. Charts will be empty.`);
        }
      }, 100);

    } catch (error: any) {
      this.errorMessage = `Error fetching data: ${error.message || 'An unknown error occurred.'}`;
      console.error('Error in searchUser:', error);
      this.isLoading = false;
    } finally {
      console.log("[searchUser] Search process finished (finally block).");
    }
  }

  // Helper to get canvas context, trying both getElementById and querySelector
  private getChartContext(chartId: string): CanvasRenderingContext2D | null {
    console.log(`[getChartContext] Attempting to get canvas context for ID: '${chartId}'`);
    let canvas = document.getElementById(chartId) as HTMLCanvasElement;

    if (!canvas) {
      console.warn(`[getChartContext] getElementById('${chartId}') returned null. Trying querySelector...`);
      canvas = document.querySelector(`#${chartId}`) as HTMLCanvasElement;
    }

    if (!canvas) {
      console.error(`[getChartContext] Canvas element with ID '${chartId}' still NOT found after both attempts.`);
      return null;
    }

    // Double-check element type
    if (!(canvas instanceof HTMLCanvasElement)) {
        console.error(`[getChartContext] Element with ID '${chartId}' found, but it's not a canvas element!`, canvas);
        return null;
    }

    console.log(`[getChartContext] Canvas element with ID '${chartId}' found successfully.`);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`[getChartContext] Failed to get 2D rendering context for canvas ID '${chartId}'.`);
      return null;
    }
    return ctx;
  }

  // --- CHART 1: My Task Status Breakdown (Doughnut Chart) ---
  drawMyTaskStatusChart() {
    console.log("[drawMyTaskStatusChart] Attempting to draw chart.");
    interface Counts { [key: string]: number; pending: number; 'in-progress': number; completed: number; }
    const counts: Counts = { 'pending': 0, 'in-progress': 0, 'completed': 0, };

    this.currentUserTasks.forEach(t => {
      const status = t.status ? t.status.toLowerCase().trim() : '';
      if (['pending', 'in-progress', 'completed'].includes(status)) {
        counts[status as keyof Counts]++;
      }
    });

    const totalCount = Object.values(counts).reduce((sum, current) => sum + current, 0);
    console.log(`[drawMyTaskStatusChart] Task status counts: ${JSON.stringify(counts)}, Total: ${totalCount}`);

    if (totalCount === 0) {
      console.warn("[drawMyTaskStatusChart] No data for chart, destroying existing.");
      this.destroyChart('chart-user-status');
      return;
    }

    this.destroyChart('chart-user-status');
    const ctx = this.getChartContext('chart-user-status'); // Use the new helper
    if (!ctx) { return; } // getChartContext will log the specific failure

    const gradient1 = ctx.createLinearGradient(0, 0, 0, 400);
    const gradient2 = ctx.createLinearGradient(0, 0, 0, 400);
    const gradient3 = ctx.createLinearGradient(0, 0, 0, 400);

    // Make sure gradients are not null before adding color stops
    if (gradient1 && gradient2 && gradient3) {
      gradient1.addColorStop(0, 'rgba(255, 204, 0, 0.9)');
      gradient1.addColorStop(1, 'rgba(255, 153, 0, 0.9)');
      gradient2.addColorStop(0, 'rgba(51, 153, 255, 0.9)');
      gradient2.addColorStop(1, 'rgba(0, 102, 204, 0.9)');
      gradient3.addColorStop(0, 'rgba(102, 204, 0, 0.9)');
      gradient3.addColorStop(1, 'rgba(0, 102, 0, 0.9)');
    } else {
      console.warn("[drawMyTaskStatusChart] Could not create gradients. Using solid colors.");
    }


    const chart = new Chart(ctx.canvas, { // Pass ctx.canvas to Chart constructor
      type: 'doughnut',
      data: {
        labels: ['Pending', 'In Progress', 'Completed'],
        datasets: [{
          data: [counts['pending'], counts['in-progress'], counts['completed']],
          backgroundColor: [
            gradient1 || 'rgba(255, 204, 0, 0.8)',
            gradient2 || 'rgba(51, 153, 255, 0.8)',
            gradient3 || 'rgba(102, 204, 0, 0.8)'
          ],
          borderColor: ['#fff', '#fff', '#fff'], borderWidth: 2, hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        animation: { animateScale: true, animateRotate: true, duration: 1500, easing: 'easeInOutQuart' },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#555', font: { weight: 'normal', size: 13 } } },
          tooltip: {
            enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', bodyFont: { size: 12 }, titleFont: { size: 14, weight: 'bold' },
            callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} tasks` }
          },
          datalabels: {
            color: '#fff', formatter: (value) => value > 0 ? `${((value / totalCount) * 100).toFixed(1)}%` : '',
            font: { weight: 'bold', size: 14 }, rotation: 30
          }
        }
      }
    });
    this.chartInstances.push(chart);
    console.log("[drawMyTaskStatusChart] Chart created successfully.");
  }

  // --- CHART 2: My Task Load Over Time (Bar Chart) ---
  drawMyTaskLoadChart() {
    console.log("[drawMyTaskLoadChart] Attempting to draw chart.");
    const map: Record<string, number> = {};
    this.currentUserTasks.forEach(t => {
      const dateObj = this.toDateObject(t.createdAt);
      const d = this.getLocalDateString(dateObj);
      if (d !== 'N/A') map[d] = (map[d] || 0) + 1;
    });
    const labels = Object.keys(map).sort();
    const data = labels.map(date => map[date]);
    console.log(`[drawMyTaskLoadChart] Labels: ${labels.join(', ')}, Data: ${data.join(', ')}`);

    if (data.length === 0) { console.warn("[drawMyTaskLoadChart] No data for chart, destroying existing."); this.destroyChart('chart-user-load'); return; }
    this.destroyChart('chart-user-load');
    const ctx = this.getChartContext('chart-user-load'); // Use the new helper
    if (!ctx) { return; }
    console.log("[drawMyTaskLoadChart] Canvas element found. Drawing...");


    const chart = new Chart(ctx.canvas, { // Pass ctx.canvas to Chart constructor
      type: 'bar', data: {
        labels, datasets: [{
          label: 'Tasks Assigned', data,
          backgroundColor: 'rgba(70, 130, 180, 0.8)',
          borderColor: 'rgba(70, 130, 180, 1)', borderWidth: 1, borderRadius: 8,
          barPercentage: 0.8, categoryPercentage: 0.8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 1500, easing: 'easeOutBounce' },
        plugins: {
          legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw} tasks` } },
          datalabels: { color: '#333', anchor: 'end', align: 'top', offset: 4, font: { weight: 'bold' } }
        },
        scales: {
          x: { title: { display: true, text: 'Date Assigned', font: { weight: 'bold' } }, grid: { display: false } },
          y: { beginAtZero: true, title: { display: true, text: 'Task Count', font: { weight: 'bold' } }, ticks: { stepSize: 1 }, grid: { color: '#e0e0e0', drawOnChartArea: false } }
        }
      }
    });
    this.chartInstances.push(chart);
    console.log("[drawMyTaskLoadChart] Chart created successfully.");
  }

  // --- CHART 3: My Task Completion Rate (Horizontal Bar Chart) ---
  drawMyTaskCompletionRateChart() {
    console.log("[drawMyTaskCompletionRateChart] Attempting to draw chart.");
    const total = this.currentUserTasks.length;
    const done = this.currentUserTasks.filter(t => t.status === 'completed').length;
    const pending = total - done;
    console.log(`[drawMyTaskCompletionRateChart] Completed: ${done}, Pending: ${pending}, Total: ${total}`);

    if (total === 0) { console.warn("[drawMyTaskCompletionRateChart] No data for chart, destroying existing."); this.destroyChart('chart-user-completion'); return; }
    this.destroyChart('chart-user-completion');
    const ctx = this.getChartContext('chart-user-completion'); // Use the new helper
    if (!ctx) { return; }
    console.log("[drawMyTaskCompletionRateChart] Canvas element found. Drawing...");


    const chart = new Chart(ctx.canvas, { // Pass ctx.canvas to Chart constructor
      type: 'bar',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
          label: 'Task Count', data: [done, pending],
          backgroundColor: ['rgba(144, 238, 144, 0.8)', 'rgba(255, 99, 132, 0.8)'],
          borderColor: ['#fff', '#fff'], borderWidth: 1, borderRadius: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y', animation: { duration: 1500, easing: 'easeOutElastic' },
        plugins: {
          legend: { display: false }, title: { display: true, text: 'My Task Completion Rate', font: { weight: 'bold', size: 16 } },
          datalabels: { color: '#fff', anchor: 'end', align: 'right', offset: 8, font: { weight: 'bold', size: 14 }, formatter: (value) => value > 0 ? `${((value / total) * 100).toFixed(1)}%` : '' }
        }
      }
    });
    this.chartInstances.push(chart);
    console.log("[drawMyTaskCompletionRateChart] Chart created successfully.");
  }

  // --- CHART 4: My Overdue Tasks Glance (Doughnut Chart) ---
  drawMyOverdueTasksChart() {
    console.log("[drawMyOverdueTasksChart] Attempting to draw chart.");
    const now = Date.now();
    const overdue = this.currentUserTasks.filter(t => {
      const reminderDateObj = this.toDateObject(t.reminderDate);
      return t.status !== 'completed' && reminderDateObj && reminderDateObj.valueOf() < now;
    }).length;
    const onTime = this.currentUserTasks.length - overdue;
    console.log(`[drawMyOverdueTasksChart] Overdue: ${overdue}, On-Time: ${onTime}, Total: ${this.currentUserTasks.length}`);

    if (this.currentUserTasks.length === 0) { console.warn("[drawMyOverdueTasksChart] No data for chart, destroying existing."); this.destroyChart('chart-user-overdue'); return; }
    this.destroyChart('chart-user-overdue');
    const ctx = this.getChartContext('chart-user-overdue'); // Use the new helper
    if (!ctx) { return; }
    console.log("[drawMyOverdueTasksChart] Canvas element found. Drawing...");

    const chart = new Chart(ctx.canvas, { // Pass ctx.canvas to Chart constructor
      type: 'doughnut', data: {
        labels: ['Overdue Tasks', 'On-Time Tasks'], datasets: [{
          data: [overdue, onTime],
          backgroundColor: ['rgba(255, 99, 132, 0.9)', 'rgba(54, 162, 235, 0.9)'],
          borderColor: ['#fff', '#fff'], borderWidth: 2, hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%', animation: { animateScale: true, animateRotate: true, duration: 1500, easing: 'easeInOutQuart' },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#555', font: { weight: 'normal', size: 13 } } },
          title: { display: true, text: 'My Overdue Tasks Glance', font: { weight: 'bold', size: 16 } },
          datalabels: { color: '#fff', formatter: (value) => value > 0 ? `${((value / this.currentUserTasks.length) * 100).toFixed(1)}%` : '', font: { weight: 'bold', size: 14 }, rotation: 30 }
        }
      }
    });
    this.chartInstances.push(chart);
    console.log("[drawMyOverdueTasksChart] Chart created successfully.");
  }

  private destroyChart(chartId: string): void {
    const existingChart = Chart.getChart(chartId);
    if (existingChart) {
      existingChart.destroy();
      this.chartInstances = this.chartInstances.filter(chart => chart.id !== existingChart.id);
    }
  }
}
