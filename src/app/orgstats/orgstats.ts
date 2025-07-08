import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Firestore, collection, getDocs, query, doc, getDoc } from '@angular/fire/firestore'; // Re-import Firestore
import { CommonModule } from '@angular/common'; // Import CommonModule explicitly for *ngIf, *ngFor
import {
  Chart,
  registerables,
  ChartConfiguration,
  ChartData,
  ChartType,
} from 'chart.js';
import * as ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js and the datalabels plugin
Chart.register(...registerables, ChartDataLabels);

// --- Interfaces for your data structure ---
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?(): Date; // Firestore Timestamp objects have a toDate() method
}

interface Task {
  assignedTo?: string[]; // Array of user UIDs
  createdAt?: FirestoreTimestamp | Date | string;
  enquiryDate?: string; // Assuming this might still be a string or timestamp
  reminderDate?: FirestoreTimestamp | Date | string;
  dueDate?: FirestoreTimestamp | Date | string; // Added dueDate
  status?: string;
  taskDetail?: string; // Renamed from description based on user's sample
  description?: string; // Keep description for robustness
  updatedAt?: FirestoreTimestamp | Date | string;
}

interface User {
  uid: string; // The user's UID
  displayName?: string;
  email?: string;
  // Add other user fields as needed
}

@Component({
  selector: 'app-task-analytics',
  standalone: true, // Mark as standalone
  imports: [CommonModule], // Import CommonModule
  template: `
    <div class="container mx-auto p-6 bg-gray-800 rounded-xl shadow-lg my-8 border border-gray-700">
      <h1 class="text-3xl font-extrabold text-center text-gray-100 mb-8">Organization Analytics</h1>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading" class="text-center p-4">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-gray-600 mx-auto"></div>
        <p class="mt-4 text-gray-300">Loading analytics data from all domains and projects...</p>
      </div>

      <!-- Charts Grid -->
      <div *ngIf="!isLoading && tasks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Chart 1: Task Status Distribution -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Task Status Distribution</h2>
          <div class="chart-container">
            <canvas id="chart1"></canvas>
          </div>
        </div>

        <!-- Chart 2: Tasks Created Per Day -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Tasks Created Per Day</h2>
          <div class="chart-container">
            <canvas id="chart2"></canvas>
          </div>
        </div>

        <!-- Chart 3: Tasks Completed Per Day -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Tasks Completed Per Day</h2>
          <div class="chart-container">
            <canvas id="chart3"></canvas>
          </div>
        </div>

        <!-- Chart 4: Task Completion Rate -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Task Completion Rate</h2>
          <div class="chart-container">
            <canvas id="chart4"></canvas>
          </div>
        </div>

        <!-- Chart 5: Average Completion Time -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Average Completion Time (Hours)</h2>
          <div class="chart-container">
            <canvas id="chart5"></canvas>
          </div>
        </div>

        <!-- Chart 6: Tasks Assigned Per User -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Tasks Assigned Per User</h2>
          <div class="chart-container">
            <canvas id="chart6"></canvas>
          </div>
        </div>

        <!-- Chart 7: Overdue vs. On-Time Tasks -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Overdue vs. On-Time Tasks</h2>
          <div class="chart-container">
            <canvas id="chart7"></canvas>
          </div>
        </div>

        <!-- Chart 8: Tasks by Enquiry Date -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Tasks by Enquiry Date</h2>
          <div class="chart-container">
            <canvas id="chart8"></canvas>
          </div>
        </div>

        <!-- Chart 9: Daily Active Users -->
        <div #chart9CanvasContainer class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Daily Active Users</h2>
          <div class="chart-container">
            <canvas id="chart9"></canvas>
          </div>
        </div>

        <!-- Chart 10: Daily Update Frequency -->
        <div class="bg-gray-900 p-6 rounded-lg shadow-md flex flex-col items-center justify-center border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Daily Update Frequency</h2>
          <div class="chart-container">
            <canvas id="chart10"></canvas>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div *ngIf="!isLoading && tasks.length === 0" class="text-center text-gray-400 p-6">
        <p class="text-lg">No task data available for analytics.</p>
        <p class="text-sm mt-2">Ensure tasks are being logged in your Firestore under organizations > domain > projects (with tasks as an array), and users under organizations > domain > users.</p>
      </div>
    </div>

    <style>
      /* Global styles for the entire page to ensure dark backdrop */
      body {
        background-color: #1a202c; /* A dark gray/blue */
        color: #e2e8f0; /* Light gray text for contrast */
        font-family: 'Inter', sans-serif; /* Recommended font */
      }

      .chart-container {
        position: relative;
        height: 300px; /* Fixed height for charts */
        width: 100%;
      }
    </style>
  `,
  styleUrls: [], // No separate SCSS file needed if using only Tailwind classes in HTML
})
export class Orgstats implements OnInit, AfterViewInit, OnDestroy {
  tasks: Task[] = [];
  isLoading = false; // Added loading state
  @ViewChild('chart9CanvasContainer', { static: false })
  chart9CanvasContainer!: ElementRef;
  private intersectionObserver!: IntersectionObserver;
  private chart9Initialized = false;

  // This map will be dynamically populated from Firestore
  private userIdToNameMap: { [key: string]: string } = {};

  constructor(private firestore: Firestore) {} // Re-inject Firestore

  async ngOnInit() {
    this.isLoading = true; // Set loading to true
    let orgId = localStorage.getItem('orgId');
    console.log('DEBUG: 1. Attempting to retrieve orgId from localStorage. orgId:', orgId);

    if (!orgId) {
      console.error('DEBUG: Org ID not found in localStorage. Cannot fetch data.');
      this.isLoading = false; // Stop loading
      return;
    }

    this.tasks = []; // Reset tasks array before fetching new data
    this.userIdToNameMap = {}; // Reset user map

    try {
      // 1. Fetch all domains for the organization
      const domainsRef = collection(this.firestore, `organizations/${orgId}/domain`);
      console.log(`DEBUG: 2. Querying domains at path: organizations/${orgId}/domain`);
      const domainsSnap = await getDocs(query(domainsRef));
      console.log(`DEBUG: 3. Found ${domainsSnap.docs.length} domains.`);

      const domainPromises: Promise<void>[] = [];

      for (const domainDoc of domainsSnap.docs) {
        const domainUid = domainDoc.id; // domainDoc.id is the domain's UID
        console.log(`DEBUG: 4. Processing domain with UID: ${domainUid}`);

        // Promise to fetch users for the current domain
        const usersPromise = (async () => {
          const usersRef = collection(this.firestore, `organizations/${orgId}/domain/${domainUid}/users`);
          console.log(`DEBUG: 5. Querying users at path: organizations/${orgId}/domain/${domainUid}/users`);
          const usersSnap = await getDocs(query(usersRef));
          console.log(`DEBUG: 6. Found ${usersSnap.docs.length} users in domain ${domainUid}.`);

          usersSnap.docs.forEach(userDoc => {
            const userUid = userDoc.id; // userDoc.id is the user's UID
            const userData = userDoc.data() as User;
            if (userUid && userData.displayName) {
              this.userIdToNameMap[userUid] = userData.displayName;
              console.log(`DEBUG: Mapped user ${userUid} to display name: ${userData.displayName}`);
            } else if (userUid && userData.email) {
              this.userIdToNameMap[userUid] = userData.email.split('@')[0]; // Use part before @
              console.log(`DEBUG: Mapped user ${userUid} to email prefix: ${userData.email.split('@')[0]}`);
            } else {
              this.userIdToNameMap[userUid] = `User (${userUid.substring(0, 4)}...)`;
              console.log(`DEBUG: Mapped user ${userUid} to generic name.`);
            }
          });
        })();
        domainPromises.push(usersPromise);

        // Fetch projects and their tasks (from array) for the current domain
        const projectsRef = collection(this.firestore, `organizations/${orgId}/domain/${domainUid}/projects`);
        console.log(`DEBUG: 7. Querying projects at path: organizations/${orgId}/domain/${domainUid}/projects`);
        const projectsSnap = await getDocs(query(projectsRef));
        console.log(`DEBUG: 8. Found ${projectsSnap.docs.length} projects in domain ${domainUid}.`);

        projectsSnap.docs.forEach((projectDoc) => {
          const projectUid = projectDoc.id; // projectDoc.id is the project's UID
          console.log(`DEBUG: 9. Processing project with UID: ${projectUid} in domain ${domainUid}.`);
          // Access the 'tasks' array directly from the project document data
          const projectData = projectDoc.data();
          console.log(`DEBUG: 10. Raw project data for ${projectUid}:`, projectData);

          if (projectData && Array.isArray(projectData['tasks'])) {
            const tasksInProject = projectData['tasks'] as Task[];
            console.log(`DEBUG: 11. Found ${tasksInProject.length} tasks in 'tasks' array in project ${projectUid}.`);
            tasksInProject.forEach(task => {
              this.tasks.push(task);
              // console.log('DEBUG: Added task:', task); // Commented for less verbose logging unless needed
            });
          } else {
            console.warn(`DEBUG: No 'tasks' array found or it's not an array in project ${projectUid}.`);
          }
        });
      }

      await Promise.all(domainPromises); // Wait for all domains' users to be fetched

      console.log('--- FINAL DEBUGGING SUMMARY ---');
      console.log('1. Org ID from localStorage:', orgId);
      console.log('2. Total tasks fetched (count):', this.tasks.length);
      console.log('3. Populated userIdToNameMap:', this.userIdToNameMap);
      if (this.tasks.length > 0) {
        console.log('4. First task data (full object):', this.tasks[0]);
        console.log('   First task status:', this.tasks[0].status);
        console.log('   First task createdAt (raw):', this.tasks[0].createdAt);
        console.log('   First task createdAt (parsed):', this.toDateObject(this.tasks[0].createdAt));
        console.log('   First task assignedTo:', this.tasks[0].assignedTo);
        console.log('   First task dueDate (raw):', this.tasks[0].dueDate);
        console.log('   First task dueDate (parsed):', this.toDateObject(this.tasks[0].dueDate));
        console.log('   First task reminderDate (raw):', this.tasks[0].reminderDate);
        console.log('   First task reminderDate (parsed):', this.toDateObject(this.tasks[0].reminderDate));
        console.log('   First task enquiryDate (raw):', this.tasks[0].enquiryDate);
        console.log('   First task enquiryDate (parsed):', this.toDateObject(this.tasks[0].enquiryDate));
      } else {
        console.warn(
          '   No tasks found across all domains and projects for orgId:',
          orgId,
          '. Charts will be empty or show zeros.'
        );
      }
      console.log('--- END FINAL DEBUGGING SUMMARY ---');

    } catch (error) {
      console.error('DEBUG: Error fetching data from Firestore:', error);
    } finally {
      this.isLoading = false; // Always set loading to false
      console.log('DEBUG: Data loading complete. isLoading:', this.isLoading, 'tasks.length:', this.tasks.length);
    }
  }

  ngAfterViewInit(): void {
    console.log('DEBUG: ngAfterViewInit called. Current isLoading:', this.isLoading, 'Current tasks.length:', this.tasks.length);

    // Only attempt to render charts if not loading and tasks are available
    if (!this.isLoading && this.tasks.length > 0) {
      console.log('DEBUG: ngAfterViewInit: Tasks available, wrapping renderAllCharts in setTimeout(0).');
      // Use setTimeout(0) to ensure DOM is fully rendered before Chart.js tries to draw
      setTimeout(() => {
        this.renderAllCharts();
      }, 0);
    } else if (!this.isLoading && this.tasks.length === 0) {
      console.warn('DEBUG: ngAfterViewInit: No tasks available after loading. Charts will not be rendered.');
    }

    if (
      this.chart9CanvasContainer &&
      this.chart9CanvasContainer.nativeElement
    ) {
      this.intersectionObserver = new IntersectionObserver(
        this.onChart9Intersection.bind(this),
        {
          root: null,
          threshold: 0.5,
        }
      );
      this.intersectionObserver.observe(
        this.chart9CanvasContainer.nativeElement
      );
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    for (let i = 1; i <= 10; i++) {
      const chartId = `chart${i}`;
      const existingChart = Chart.getChart(chartId);
      if (existingChart) existingChart.destroy();
    }
  }

  private toDateObject(
    value: FirestoreTimestamp | Date | string | undefined
  ): Date | undefined {
    if (value == null) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    // Handle Firestore Timestamp object directly
    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as any).toDate === 'function'
    ) {
      return (value as any).toDate();
    }

    // Fallback for raw {seconds: ..., nanoseconds: ...} if toDate() is not present
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as any).seconds === 'number'
    ) {
      return new Date(
        (value as any).seconds * 1000 +
          ((value as any).nanoseconds || 0) / 1_000_000
      );
    }

    // Handle string dates like "1 July 2025 at 01:05:25 UTC+5:30"
    if (typeof value === 'string') {
      let parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      const match = value.match(/(\d+) (\w+) (\d+) at (\d+):(\d+):(\d+) UTC([+-]\d+):(\d+)/);
      if (match) {
        const [, day, monthStr, year, hour, minute, second, tzOffsetHourStr, tzOffsetMinuteStr] = match;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = monthNames.indexOf(monthStr);

        if (month !== -1) {
          const tzOffsetHours = parseInt(tzOffsetHourStr, 10);
          const tzOffsetMinutes = parseInt(tzOffsetMinuteStr, 10);
          const totalTzOffsetMinutes = tzOffsetHours * 60 + (tzOffsetHours < 0 ? -tzOffsetMinutes : tzOffsetMinutes);

          const utcDate = new Date(Date.UTC(
            parseInt(year, 10),
            month,
            parseInt(day, 10),
            parseInt(hour, 10),
            parseInt(minute, 10),
            parseInt(second, 10)
          ));

          utcDate.setMinutes(utcDate.getMinutes() - totalTzOffsetMinutes);
          return utcDate;
        }
      }
    }
    console.warn('DEBUG: toDateObject: Could not convert value to Date:', value);
    return undefined;
  }

  private getLocalDateString(date: Date | undefined): string {
    if (!date) return '';
    return [
      date.getFullYear(),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getDate().toString().padStart(2, '0'),
    ].join('-');
  }

  renderAllCharts() {
    console.log(
      'DEBUG: renderAllCharts() called. this.tasks.length:',
      this.tasks.length
    );
    this.drawStatusChart();
    this.drawCreatedPerDay();
    this.drawCompletedPerDay();
    this.drawCompletionRateChart();
    this.drawAvgCompletionTime();
    this.drawTasksPerUserChart();
    this.drawOverdueTasksChart();
    this.drawTasksByEnquiryChart();
    this.drawActiveUsersChart();
    this.drawDailyUpdateFreq();
  }

  drawStatusChart() {
    interface Counts {
      [key: string]: number;
      'not-yet-completed': number; // Updated key
      'in-progress': number;
      completed: number;
    }
    // Initialize counts with the new key
    const counts: Counts = { 'not-yet-completed': 0, 'in-progress': 0, completed: 0 };
    this.tasks.forEach((t) => {
      // Normalize the status from the database: lowercase and replace spaces with hyphens
      const normalizedStatus = t.status
        ? String(t.status).toLowerCase().trim().replace(/ /g, '-')
        : '';
      if (normalizedStatus && counts.hasOwnProperty(normalizedStatus)) {
        counts[normalizedStatus as keyof Counts]++;
      } else {
        console.warn(`DEBUG: Unrecognized or empty status encountered: "${t.status}" (normalized to "${normalizedStatus}")`);
      }
    });
    const totalStatusCount = (Object.values(counts) as number[]).reduce(
      (sum, current) => sum + current,
      0
    );
    if (totalStatusCount === 0) {
      console.warn(
        'DEBUG: No tasks with recognized statuses found for Status Distribution chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart1');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart1');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart1') as HTMLCanvasElement;
    console.log('DEBUG: drawStatusChart - Canvas element "chart1" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart1' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawStatusChart - Canvas context for "chart1" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart1'.");
      return;
    }

    // Updated labels and data to use 'Not Yet Completed'
    const labels = ['Not Yet Completed', 'In Progress', 'Completed']; // Display labels
    const data = [counts['not-yet-completed'], counts['in-progress'], counts['completed']];
    console.log('DEBUG: drawStatusChart - Labels:', labels, 'Data:', data);

    const gradient1 = chartCtx.createLinearGradient(0, 0, 0, 400);
    const gradient2 = chartCtx.createLinearGradient(0, 0, 0, 400);
    const gradient3 = chartCtx.createLinearGradient(0, 0, 0, 400);
    if (gradient1 && gradient2 && gradient3) {
      gradient1.addColorStop(0, 'rgba(255, 204, 0, 0.8)'); // Yellow for Not Yet Completed
      gradient1.addColorStop(1, 'rgba(255, 153, 0, 0.8)');
      gradient2.addColorStop(0, 'rgba(51, 153, 255, 0.8)'); // Blue for In Progress
      gradient2.addColorStop(1, 'rgba(0, 102, 204, 0.8)');
      gradient3.addColorStop(0, 'rgba(102, 204, 0, 0.8)'); // Green for Completed
      gradient3.addColorStop(1, 'rgba(0, 102, 0, 0.8)');
    }
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              gradient1 || 'rgba(255, 204, 0, 0.8)',
              gradient2 || 'rgba(51, 153, 255, 0.8)',
              gradient3 || 'rgba(102, 204, 0, 0.8)',
            ],
            borderColor: [
              'rgba(255, 204, 0, 1)',
              'rgba(51, 153, 255, 1)',
              'rgba(102, 204, 0, 1)',
            ],
            borderWidth: 2,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1200,
          easing: 'easeInOutCubic',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#ccc', font: { weight: 'normal', size: 13 } }, // Dark UI text color
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker tooltip background
            bodyColor: '#eee', // Light text for body
            titleColor: '#fff', // White text for title
            bodyFont: { size: 12 },
            titleFont: { size: 14, weight: 'bold' },
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} tasks` },
          },
          datalabels: {
            color: '#fff', // White for datalabels
            formatter: (value, context) => {
              const total = (Object.values(counts) as number[]).reduce(
                (sum, current) => sum + current,
                0
              );
              return total === 0
                ? '0%'
                : `${((value / total) * 100).toFixed(1)}%`;
            },
            font: { weight: 'bold' },
            rotation: 30,
          },
        },
      },
    });
  }

  drawCreatedPerDay() {
    const map: Record<string, number> = {};
    this.tasks.forEach((t) => {
      const dateObj = this.toDateObject(t.createdAt);
      const d = this.getLocalDateString(dateObj);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    const labels = Object.keys(map).sort();
    const data = labels.map((date) => map[date]);
    if (data.length === 0) {
      console.warn(
        'DEBUG: No data for Tasks Created Per Day chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart2');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart2');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart2') as HTMLCanvasElement;
    console.log('DEBUG: drawCreatedPerDay - Canvas element "chart2" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart2' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawCreatedPerDay - Canvas context for "chart2" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart2'.");
      return;
    }
    console.log('DEBUG: drawCreatedPerDay - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Tasks Created Per Day',
            data,
            backgroundColor: 'rgba(70, 130, 180, 0.7)', // SteelBlue
            borderColor: 'rgba(70, 130, 180, 1)',
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.raw} tasks` },
          },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
          title: {
            display: true,
            text: 'Tasks Created Per Day',
            color: '#eee', // Dark UI title color
            font: { weight: 'bold', size: 16 },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Date', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Task Count',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
      },
    });
  }

  drawCompletedPerDay() {
    const map: Record<string, number> = {};
    this.tasks
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        const dateObj = this.toDateObject(t.reminderDate); // Using reminderDate for completion
        const d = this.getLocalDateString(dateObj);
        if (d) map[d] = (map[d] || 0) + 1;
      });
    const labels = Object.keys(map).sort();
    const data = labels.map((label) => map[label]);
    if (data.length === 0) {
      console.warn(
        'DEBUG: No data for Tasks Completed Per Day chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart3');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart3');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart3') as HTMLCanvasElement;
    console.log('DEBUG: drawCompletedPerDay - Canvas element "chart3" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart3' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawCompletedPerDay - Canvas context for "chart3" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart3'.");
      return;
    }
    console.log('DEBUG: drawCompletedPerDay - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tasks Completed',
            data: data,
            backgroundColor: 'rgba(144, 238, 144, 0.7)', // LightGreen
            borderColor: 'rgba(144, 238, 144, 1)',
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Tasks',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          x: {
            title: { display: true, text: 'Date', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Completed Tasks Per Day',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          legend: { display: false },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.raw} tasks` },
          },
        },
      },
    });
  }

  drawCompletionRateChart() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === 'completed').length;
    const pending = total - done; // This pending is for the chart, not the status key
    if (total === 0) {
      console.warn(
        'DEBUG: No data for Task Completion Rate chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart4');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart4');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart4') as HTMLCanvasElement;
    console.log('DEBUG: drawCompletionRateChart - Canvas element "chart4" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart4' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawCompletionRateChart - Canvas context for "chart4" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart4'.");
      return;
    }
    const labels = ['Completed', 'Not Yet Completed']; // Updated label
    const data = [done, pending];
    console.log('DEBUG: drawCompletionRateChart - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Task Count',
            data: data,
            backgroundColor: [
              'rgba(144, 238, 144, 0.7)', // LightGreen for Completed
              'rgba(255, 99, 132, 0.7)', // Red for Not Yet Completed
            ],
            borderColor: ['rgba(144, 238, 144, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Tasks',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          y: {
            title: { display: true, text: 'Status', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Task Completion Rate',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'right',
            offset: 4,
            font: { weight: 'bold' },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} tasks` },
          },
        },
      },
    });
  }

  drawAvgCompletionTime() {
    let sum = 0;
    let count = 0;
    this.tasks
      .filter((t) => t.status === 'completed' && t.createdAt && t.dueDate) // Use dueDate for completion time
      .forEach((t) => {
        const createdDate = this.toDateObject(t.createdAt);
        const dueDate = this.toDateObject(t.dueDate);
        if (createdDate && dueDate) {
          const durationInHours =
            (dueDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          if (!isNaN(durationInHours)) {
            sum += durationInHours;
            count++;
          }
        }
      });
    const avg = count ? +(sum / count).toFixed(2) : 0;
    if (count === 0) {
      console.warn(
        'DEBUG: No completed tasks with valid dates for Average Completion Time chart. Chart will be empty.'
      );
      const existingChart = Chart.getChart('chart5');
      if (existingChart) existingChart.destroy();
      return;
    }
    const existingChart = Chart.getChart('chart5');
    if (existingChart) existingChart.destroy();
    const ctx = document.getElementById('chart5') as HTMLCanvasElement;
    console.log('DEBUG: drawAvgCompletionTime - Canvas element "chart5" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart5' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawAvgCompletionTime - Canvas context for "chart5" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart5'.");
      return;
    }
    const labels = ['Average Completion Time'];
    const data = [avg];
    console.log('DEBUG: drawAvgCompletionTime - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Hours',
            data: data,
            backgroundColor: 'rgba(255, 206, 86, 0.7)', // Gold
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 2,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeInOutElastic' },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Hours', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          x: { display: false },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (context) => `${context.raw} hours` },
          },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
          title: {
            display: true,
            text: 'Average Completion Time (Hours)',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
        },
      },
    });
  }

  drawTasksPerUserChart() {
    const taskCountsPerUser: Record<string, number> = {};
    this.tasks.forEach((task) => {
      if (
        task.assignedTo &&
        Array.isArray(task.assignedTo) &&
        task.assignedTo.length > 0
      ) {
        task.assignedTo.forEach((userUid: string) => { // Using userUid for clarity
          if (typeof userUid === 'string' && userUid) {
            taskCountsPerUser[userUid] = (taskCountsPerUser[userUid] || 0) + 1;
          }
        });
      } else {
        const unassignedKey = 'Unassigned';
        taskCountsPerUser[unassignedKey] =
          (taskCountsPerUser[unassignedKey] || 0) + 1;
      }
    });
    const sortedUids = Object.keys(taskCountsPerUser).sort();
    const displayLabels = sortedUids.map(
      (uid) =>
        this.userIdToNameMap[uid] || `Unknown User (${uid.substring(0, 4)}...)`
    );
    const dataValues = sortedUids.map((uid) => taskCountsPerUser[uid]);
    if (dataValues.length === 0) {
      console.warn('DEBUG: No data for Tasks Per User chart. Chart will be empty.');
      const existing = Chart.getChart('chart6');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart6');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart6') as HTMLCanvasElement;
    console.log('DEBUG: drawTasksPerUserChart - Canvas element "chart6" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart6' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawTasksPerUserChart - Canvas context for "chart6" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart6'.");
      return;
    }
    console.log('DEBUG: drawTasksPerUserChart - Labels:', displayLabels, 'Data:', dataValues);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: 'Number of Tasks',
            data: dataValues,
            backgroundColor: 'rgba(70, 130, 180, 0.7)', // SteelBlue
            borderColor: 'rgba(70, 130, 180, 1)',
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Tasks',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          x: {
            title: { display: true, text: 'User', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Tasks Assigned Per User',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: {
              title: (tooltipItems) => tooltipItems[0].label,
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} tasks`,
            },
          },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
        },
      },
    });
  }

  drawOverdueTasksChart() {
    const now = Date.now();
    const overdue = this.tasks.filter((t) => {
      const dueDateObj = this.toDateObject(t.dueDate); // Use dueDate for overdue check
      return (
        t.status !== 'completed' &&
        dueDateObj &&
        dueDateObj.valueOf() < now
      );
    }).length;
    const onTime = this.tasks.length - overdue;
    if (this.tasks.length === 0) {
      console.warn(
        'DEBUG: No tasks for Overdue vs. On-Time Tasks chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart7');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart7');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart7') as HTMLCanvasElement;
    console.log('DEBUG: drawOverdueTasksChart - Canvas element "chart7" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart7' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawOverdueTasksChart - Canvas context for "chart7" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart7'.");
      return;
    }
    const labels = ['Overdue Tasks', 'On-Time Tasks'];
    const data = [overdue, onTime];
    console.log('DEBUG: drawOverdueTasksChart - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Task Status',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)', // Red for Overdue
              'rgba(54, 162, 235, 0.7)', // Blue for On-Time
            ],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
            borderWidth: 1,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#ccc', font: { weight: 'normal' } }, // Dark UI text color
          },
          title: {
            display: true,
            text: 'Overdue vs. On-Time Tasks',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          datalabels: {
            color: '#fff', // White for datalabels
            formatter: (value, context) => {
              const total = (context.dataset.data as number[]).reduce(
                (a, b) => a + b,
                0
              );
              return total === 0
                ? '0%'
                : `${((value / total) * 100).toFixed(1)}%`;
            },
            font: { weight: 'bold' },
            rotation: 30,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} tasks` },
          },
        },
      },
    });
  }

  drawTasksByEnquiryChart() {
    const map: Record<string, number> = {};
    this.tasks.forEach((t) => {
      const dateObj = this.toDateObject(t.enquiryDate);
      const d = this.getLocalDateString(dateObj);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    const labels = Object.keys(map).sort();
    const data = labels.map((label) => map[label]);
    if (data.length === 0) {
      console.warn(
        'DEBUG: No data for Tasks by Enquiry Date chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart8');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart8');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart8') as HTMLCanvasElement;
    console.log('DEBUG: drawTasksByEnquiryChart - Canvas element "chart8" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart8' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawTasksByEnquiryChart - Canvas context for "chart8" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart8'.");
      return;
    }
    console.log('DEBUG: drawTasksByEnquiryChart - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tasks by Enquiry Date',
            data,
            fill: false,
            borderColor: 'rgba(0, 123, 255, 0.8)', // Blue
            tension: 0.3,
            pointBackgroundColor: 'rgba(0, 123, 255, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeInOutQuad' },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Enquiry Date',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Tasks',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Tasks by Enquiry Date',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.raw} tasks` },
          },
        },
      },
    });
  }

  drawActiveUsersChart() {
    const dayUsers: Record<string, Set<string>> = {};
    this.tasks.forEach((t) => {
      const dateObj = this.toDateObject(t.createdAt);
      const d = this.getLocalDateString(dateObj);
      if (d && t.assignedTo && Array.isArray(t.assignedTo)) {
        if (!dayUsers[d]) {
          dayUsers[d] = new Set<string>();
        }
        t.assignedTo.forEach((userUid: string) => { // Using userUid for clarity
          if (typeof userUid === 'string' && userUid) {
            dayUsers[d].add(userUid);
          }
        });
      }
    });
    const labels = Object.keys(dayUsers).sort();
    const data = labels.map((date) => dayUsers[date].size);
    if (data.length === 0) {
      console.warn(
        'DEBUG: No data for Daily Active Users chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart9');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart9');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart9') as HTMLCanvasElement;
    console.log('DEBUG: drawActiveUsersChart - Canvas element "chart9" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart9' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawActiveUsersChart - Canvas context for "chart9" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart9'.");
      return;
    }
    console.log('DEBUG: drawActiveUsersChart - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data,
            fill: false,
            borderColor: 'rgba(255, 193, 7, 0.8)', // Amber
            tension: 0.3,
            pointBackgroundColor: 'rgba(255, 193, 7, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Animation controlled by intersection observer
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Date', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            title: {
              display: true,
              text: 'Number of Active Users',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Active Users Per Day',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.raw} users` },
          },
        },
      },
    });
  }

  onChart9Intersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      const chartInstance = Chart.getChart('chart9');
      if (entry.isIntersecting) {
        if (!this.chart9Initialized && chartInstance) {
          (chartInstance.options as any).animation = {
            duration: 1500,
            easing: 'easeInOutQuad',
          };
          chartInstance.update();
          this.chart9Initialized = true;
        }
      } else {
        if (chartInstance) {
          (chartInstance.options as any).animation = false;
          chartInstance.update();
        }
      }
    });
  }

  drawDailyUpdateFreq() {
    const map: Record<string, number> = {};
    this.tasks.forEach((t) => {
      const dateObj = this.toDateObject(t.updatedAt);
      const d = this.getLocalDateString(dateObj);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    const labels = Object.keys(map).sort();
    const data = labels.map((label) => map[label]);
    if (data.length === 0) {
      console.warn(
        'DEBUG: No data for Daily Update Frequency chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart10');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart10');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart10') as HTMLCanvasElement;
    console.log('DEBUG: drawDailyUpdateFreq - Canvas element "chart10" found:', !!ctx);
    if (!ctx) {
      console.error("DEBUG: Canvas element 'chart10' not found.");
      return;
    }
    const chartCtx = ctx.getContext('2d');
    console.log('DEBUG: drawDailyUpdateFreq - Canvas context for "chart10" obtained:', !!chartCtx);
    if (!chartCtx) {
      console.error("DEBUG: Failed to get 2D context for canvas 'chart10'.");
      return;
    }
    console.log('DEBUG: drawDailyUpdateFreq - Labels:', labels, 'Data:', data);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Updates',
            data,
            backgroundColor: 'rgba(173, 216, 230, 0.7)', // LightBlue
            borderColor: 'rgba(173, 216, 230, 1)',
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Date', font: { weight: 'bold' } }, // Dark UI axis title
            ticks: { color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Updates',
              font: { weight: 'bold' }, // Dark UI axis title
            },
            ticks: { stepSize: 1, color: '#aaa' }, // Dark UI tick color
            grid: { color: 'rgba(255,255,255,0.1)' }, // Dark UI grid lines
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Daily Update Frequency',
            font: { weight: 'bold', size: 16 },
            color: '#eee', // Dark UI title color
          },
          legend: { display: false },
          datalabels: {
            color: '#fff', // White for datalabels
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            bodyColor: '#eee',
            titleColor: '#fff',
            callbacks: { label: (ctx) => `${ctx.raw} updates` },
          },
        },
      },
    });
  }
}
