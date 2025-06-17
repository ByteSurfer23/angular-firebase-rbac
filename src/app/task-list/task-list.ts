import { Component, Input, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';
@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule , RouterModule],
  templateUrl: './task-list.html'
})
export class TaskListComponent implements OnInit {
  @Input() orgId!: string | null;
  tasks: any[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const tasksRef = collection(this.firestore, `organizations/${this.orgId}/tasks`);
    const snap = await getDocs(tasksRef);
    this.tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteTask(taskId: string) {
    const taskRef = doc(this.firestore, `organizations/${this.orgId}/tasks/${taskId}`);
    await deleteDoc(taskRef);
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    const uid = localStorage.getItem('uid');
    logAuditActionWithSetDoc(
      this.firestore,
      uid || '',
      'task_delete',
      taskId,
      'success'
    )
    alert('Task deleted');
  }
}
