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

@Component({
  selector: 'app-update-task-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-4">
    <h2 class="text-lg font-semibold text-center">My Assigned Tasks</h2>

    <div *ngFor="let task of tasks" class="p-4 border rounded space-y-2 bg-gray-50">
      <p><strong>Task Detail:</strong> {{ task.taskDetail }}</p>
      <p><strong>Assigned To:</strong> {{ task.assignedTo }}</p>
      <p><strong>Date of Creation:</strong> {{ task.createdAt?.toDate?.() | date: 'medium' }}</p>
      <p><strong>Enquiry Date:</strong> {{ task.enquiryDate }}</p>
      <p><strong>Reminder Date:</strong> {{ task.reminderDate }}</p>
      <p><strong>Status:</strong> 
        <select [(ngModel)]="task.status" class="w-full p-2 border rounded">
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </p>
      <button (click)="updateTaskStatus(task)" class="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
        Update Status
      </button>
    </div>

    <div *ngIf="tasks.length === 0" class="text-center text-gray-500">
      No tasks assigned to you.
    </div>
  </div>
`

})
export class UpdateTaskStatusComponent implements OnInit {
  @Input() orgId!: string | null;
  @Input() userId!: string | null;
  tasks: any[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const tasksRef = collection(this.firestore, `organizations/${this.orgId}/tasks`);
    const q = query(tasksRef, where('assignedTo', '==', this.userId));
    const querySnap = await getDocs(q);
    this.tasks = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateTaskStatus(task: any) {
    try {
      const taskRef = doc(this.firestore, `organizations/${this.orgId}/tasks/${task.id}`);
      await updateDoc(taskRef, { status: task.status });
      alert('Status updated');
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status.');
    }
  }
}
