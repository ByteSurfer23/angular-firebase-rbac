import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Firestore, collection, getDocs, query } from '@angular/fire/firestore';
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
  toDate?(): Date;
}

interface Task {
  assignedTo?: string[];
  createdAt?: FirestoreTimestamp | Date | string;
  enquiryDate?: string;
  reminderDate?: FirestoreTimestamp | Date | string;
  status?: string;
  taskDetail?: string;
  updatedAt?: FirestoreTimestamp | Date | string;
}

@Component({
  selector: 'app-task-analytics',
  templateUrl: './orgstats.html',
  styleUrls: ['./orgstats.scss'],
})
export class Orgstats implements OnInit, AfterViewInit, OnDestroy {
  tasks: Task[] = [];
  @ViewChild('chart9CanvasContainer', { static: false })
  chart9CanvasContainer!: ElementRef;
  private intersectionObserver!: IntersectionObserver;
  private chart9Initialized = false;

  private userIdToNameMap: { [key: string]: string } = {
    KwOHnPFUqkdzGwe1EUJHoGW7OFW2: 'Alice Smith',
    JPrwv9v1QOY7FikzecZZcCU7s2G2: 'Bob Johnson',
    uLddNu8LNqXdT4kIfVBVKm8z75k2: 'Charlie Brown',
    uzfmMMxN7gT7tEru6nj843S5Xrx2: 'David Lee',
    mVGeBxr3BeUQnEHU105Jj6fybNb2: 'Eve Miller',
  };

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    let orgId = localStorage.getItem('orgId');
    if (!orgId) {
      console.error('Org ID not found in localStorage. Cannot fetch tasks.');
      return;
    }

    const ref = collection(this.firestore, `organizations/${orgId}/tasks`);
    try {
      const snap = await getDocs(query(ref));
      this.tasks = snap.docs.map((d) => d.data() as Task);

      console.log('--- Debugging Chart Data (from ngOnInit) ---');
      console.log('1. Org ID from localStorage:', orgId);
      console.log('2. Tasks fetched (count):', this.tasks.length);
      if (this.tasks.length > 0) {
        console.log('3. First task data (full object):', this.tasks[0]);
        console.log('   First task status:', this.tasks[0].status);
        console.log('   First task createdAt:', this.tasks[0].createdAt);
        console.log('   First task assignedTo:', this.tasks[0].assignedTo);
      } else {
        console.warn(
          '   No tasks found for orgId:',
          orgId,
          '. Charts will be empty or show zeros.'
        );
      }
      console.log('--- End Debugging Chart Data ---');

      if (this.tasks.length > 0) {
        this.renderAllCharts();
      } else {
        console.warn(
          'No tasks to render charts. Ensure your Firestore collection is populated.'
        );
      }
    } catch (error) {
      console.error('Error fetching tasks from Firestore:', error);
    }
  }

  ngAfterViewInit(): void {
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
    if (value == null) return undefined;

    if (value instanceof Date) {
      return value;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as any).toDate === 'function'
    ) {
      return (value as any).toDate();
    }

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

    if (typeof value === 'string') {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
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
      'renderAllCharts() called. this.tasks.length:',
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
      pending: number;
      'in-progress': number;
      completed: number;
    }
    const counts: Counts = { pending: 0, 'in-progress': 0, completed: 0 };
    this.tasks.forEach((t) => {
      const normalizedStatus = t.status
        ? String(t.status).toLowerCase().trim()
        : '';
      if (normalizedStatus && counts.hasOwnProperty(normalizedStatus)) {
        counts[normalizedStatus as keyof Counts]++;
      }
    });
    const totalStatusCount = (Object.values(counts) as number[]).reduce(
      (sum, current) => sum + current,
      0
    );
    if (totalStatusCount === 0) {
      console.warn(
        'No tasks with recognized statuses found for Status Distribution chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart1');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart1');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart1') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart1' not found.");
      return;
    }
    const gradient1 = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
    const gradient2 = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
    const gradient3 = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
    if (gradient1 && gradient2 && gradient3) {
      gradient1.addColorStop(0, 'rgba(255, 204, 0, 0.8)');
      gradient1.addColorStop(1, 'rgba(255, 153, 0, 0.8)');
      gradient2.addColorStop(0, 'rgba(51, 153, 255, 0.8)');
      gradient2.addColorStop(1, 'rgba(0, 102, 204, 0.8)');
      gradient3.addColorStop(0, 'rgba(102, 204, 0, 0.8)');
      gradient3.addColorStop(1, 'rgba(0, 102, 0, 0.8)');
    }
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'In Progress', 'Completed'],
        datasets: [
          {
            data: [
              counts['pending'],
              counts['in-progress'],
              counts['completed'],
            ],
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
            labels: { color: '#555', font: { weight: 'normal', size: 13 } },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            bodyFont: { size: 12 },
            titleFont: { size: 14, weight: 'bold' },
            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} tasks` },
          },
          datalabels: {
            color: '#fff',
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
        'No data for Tasks Created Per Day chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart2');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart2');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart2') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart2' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Tasks Created Per Day',
            data,
            backgroundColor: 'rgba(70, 130, 180, 0.7)',
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
          tooltip: { callbacks: { label: (ctx) => `${ctx.raw} tasks` } },
          datalabels: {
            color: '#333',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Date', font: { weight: 'bold' } },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Task Count',
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
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
        const dateObj = this.toDateObject(t.reminderDate);
        const d = this.getLocalDateString(dateObj);
        if (d) map[d] = (map[d] || 0) + 1;
      });
    const labels = Object.keys(map).sort();
    const data = labels.map((label) => map[label]);
    if (data.length === 0) {
      console.warn(
        'No data for Tasks Completed Per Day chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart3');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart3');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart3') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart3' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tasks Completed',
            data: data,
            backgroundColor: 'rgba(144, 238, 144, 0.7)',
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
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
          },
          x: {
            title: { display: true, text: 'Date', font: { weight: 'bold' } },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Completed Tasks Per Day',
            font: { weight: 'bold', size: 16 },
          },
          legend: { display: false },
          datalabels: {
            color: '#333',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
        },
      },
    });
  }

  drawCompletionRateChart() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === 'completed').length;
    const pending = total - done;
    if (total === 0) {
      console.warn(
        'No data for Task Completion Rate chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart4');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart4');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart4') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart4' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [
          {
            label: 'Task Count',
            data: [done, pending],
            backgroundColor: [
              'rgba(144, 238, 144, 0.7)',
              'rgba(255, 99, 132, 0.7)',
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
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
          },
          y: {
            title: { display: true, text: 'Status', font: { weight: 'bold' } },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Task Completion Rate',
            font: { weight: 'bold', size: 16 },
          },
          datalabels: {
            color: '#fff',
            anchor: 'end',
            align: 'right',
            offset: 4,
            font: { weight: 'bold' },
          },
        },
      },
    });
  }

  drawAvgCompletionTime() {
    let sum = 0;
    let count = 0;
    this.tasks
      .filter((t) => t.status === 'completed' && t.createdAt && t.reminderDate)
      .forEach((t) => {
        const createdDate = this.toDateObject(t.createdAt);
        const reminderDate = this.toDateObject(t.reminderDate);
        if (createdDate && reminderDate) {
          const durationInHours =
            (reminderDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          if (!isNaN(durationInHours)) {
            sum += durationInHours;
            count++;
          }
        }
      });
    const avg = count ? +(sum / count).toFixed(2) : 0;
    if (count === 0) {
      console.warn(
        'No completed tasks with valid dates for Average Completion Time chart. Chart will be empty.'
      );
      const existingChart = Chart.getChart('chart5');
      if (existingChart) existingChart.destroy();
      return;
    }
    const existingChart = Chart.getChart('chart5');
    if (existingChart) existingChart.destroy();
    const ctx = document.getElementById('chart5') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart5' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Average Completion Time'],
        datasets: [
          {
            label: 'Hours',
            data: [avg],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
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
            title: { display: true, text: 'Hours', font: { weight: 'bold' } },
          },
          x: { display: false },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (context) => `${context.raw} hours` },
          },
          datalabels: {
            color: '#333',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
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
        task.assignedTo.forEach((userId: string) => {
          if (typeof userId === 'string' && userId) {
            taskCountsPerUser[userId] = (taskCountsPerUser[userId] || 0) + 1;
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
      console.warn('No data for Tasks Per User chart. Chart will be empty.');
      const existing = Chart.getChart('chart6');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart6');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart6') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart6' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: displayLabels,
        datasets: [
          {
            label: 'Number of Tasks',
            data: dataValues,
            backgroundColor: 'rgba(70, 130, 180, 0.7)',
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
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
          },
          x: {
            title: { display: true, text: 'User', font: { weight: 'bold' } },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Tasks Assigned Per User',
            font: { weight: 'bold', size: 16 },
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => tooltipItems[0].label,
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} tasks`,
            },
          },
          datalabels: {
            color: '#333',
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
      const reminderDateObj = this.toDateObject(t.reminderDate);
      return (
        t.status !== 'completed' &&
        reminderDateObj &&
        reminderDateObj.valueOf() < now
      );
    }).length;
    const onTime = this.tasks.length - overdue;
    if (this.tasks.length === 0) {
      console.warn(
        'No tasks for Overdue vs. On-Time Tasks chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart7');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart7');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart7') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart7' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Overdue Tasks', 'On-Time Tasks'],
        datasets: [
          {
            label: 'Task Status',
            data: [overdue, onTime],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
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
            labels: { color: '#555', font: { weight: 'normal' } },
          },
          title: {
            display: true,
            text: 'Overdue vs. On-Time Tasks',
            font: { weight: 'bold', size: 16 },
          },
          datalabels: {
            color: '#fff',
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
        'No data for Tasks by Enquiry Date chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart8');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart8');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart8') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart8' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tasks by Enquiry Date',
            data,
            fill: false,
            borderColor: 'rgba(0, 123, 255, 0.8)',
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
              font: { weight: 'bold' },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Tasks',
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Tasks by Enquiry Date',
            font: { weight: 'bold', size: 16 },
          },
          legend: { display: false },
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
        t.assignedTo.forEach((userId: string) => {
          if (typeof userId === 'string' && userId) {
            dayUsers[d].add(userId);
          }
        });
      }
    });
    const labels = Object.keys(dayUsers).sort();
    const data = labels.map((date) => dayUsers[date].size);
    if (data.length === 0) {
      console.warn(
        'No data for Daily Active Users chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart9');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart9');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart9') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart9' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data,
            fill: false,
            borderColor: 'rgba(255, 193, 7, 0.8)',
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
        animation: false,
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Date', font: { weight: 'bold' } },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            title: {
              display: true,
              text: 'Number of Active Users',
              font: { weight: 'bold' },
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Active Users Per Day',
            font: { weight: 'bold', size: 16 },
          },
          legend: { display: false },
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
        'No data for Daily Update Frequency chart. Chart will be empty.'
      );
      const existing = Chart.getChart('chart10');
      if (existing) existing.destroy();
      return;
    }
    const existing = Chart.getChart('chart10');
    if (existing) existing.destroy();
    const ctx = document.getElementById('chart10') as HTMLCanvasElement;
    if (!ctx) {
      console.error("Canvas element 'chart10' not found.");
      return;
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Updates',
            data,
            backgroundColor: 'rgba(173, 216, 230, 0.7)',
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
            title: { display: true, text: 'Date', font: { weight: 'bold' } },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Updates',
              font: { weight: 'bold' },
            },
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Daily Update Frequency',
            font: { weight: 'bold', size: 16 },
          },
          legend: { display: false },
          datalabels: {
            color: '#333',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold' },
          },
        },
      },
    });
  }
}
