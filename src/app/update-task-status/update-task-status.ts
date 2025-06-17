import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';

@Component({
  selector: 'app-update-task-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-8xl mx-auto p-6  rounded  space-y-4">
      <h2 class="text-lg font-semibold text-center">My Assigned Tasks</h2>

      <div
        *ngFor="let task of tasks"
        class="w-full p-4 border rounded bg-gray-50 space-y-2"
      >
        <p><strong>Task Detail:</strong> {{ task.taskDetail }}</p>
        <p><strong>Assigned To:</strong> {{ task.assignedTo }}</p>
        <p>
          <strong>Date of Creation:</strong>
          {{ task.createdAt?.toDate?.() | date: 'medium' }}
        </p>
        <p><strong>Enquiry Date:</strong> {{ task.enquiryDate }}</p>
        <p><strong>Reminder Date:</strong> {{ task.reminderDate }}</p>

        <div>
          <label><strong>Status:</strong></label>
          <select [(ngModel)]="task.status" class="w-full p-2 border rounded">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          (click)="updateTaskStatus(task)"
          class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Update Status
        </button>
      </div>

      <div *ngIf="tasks.length === 0" class="text-center text-gray-500">
        No tasks assigned to you.
      </div>
    </div>
  `,
})
export class UpdateTaskStatusComponent implements OnInit {
  @Input() orgId!: string | null;
  @Input() userId!: string | null;
  tasks: any[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const tasksRef = collection(
      this.firestore,
      `organizations/${this.orgId}/tasks`
    );
    const q = query(
      tasksRef,
      where('assignedTo', 'array-contains', this.userId)
    );
    const querySnap = await getDocs(q);
    this.tasks = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async updateTaskStatus(task: any) {
    const status_copy = task.status;
    const task_id_copy = task.id;
    try {
      const taskRef = doc(
        this.firestore,
        `organizations/${this.orgId}/tasks/${task.id}`
      );
      await updateDoc(taskRef, { status: task.status });

      let actoruid = localStorage.getItem('uid');
      logAuditActionWithSetDoc(
        this.firestore,
        actoruid || '',
        `status_to_${status_copy}`,
        task_id_copy, // Resource is the newly created user's UID
        'success'
      );

      alert('Status updated');
    } catch (err) {
      console.error('Failed to update status:', err);
      let actoruid = localStorage.getItem('uid');
      logAuditActionWithSetDoc(
        this.firestore,
        actoruid || '',
        `status_to_${status_copy}`,
        task_id_copy, // Resource is the newly created user's UID
        'failed'
      );
      alert('Failed to update status.');
    }
  }
}
