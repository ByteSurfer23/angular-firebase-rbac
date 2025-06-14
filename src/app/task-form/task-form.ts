import { Component, Input } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './task-form.html',
})
export class TaskFormComponent {
  @Input() orgId!: string | null;

  taskDetail = '';
  enquiryDate = '';
  status = 'pending';
  assignedTo = '';
  users: any[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const usersRef = collection(this.firestore, `organizations/${this.orgId}/users`);
    const snap = await getDocs(usersRef);
    this.users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  async submitTask() {
    const taskRef = collection(this.firestore, `organizations/${this.orgId}/tasks`);
    await addDoc(taskRef, {
      taskDetail: this.taskDetail,
      assignedTo: this.assignedTo,
      createdAt: new Date(),
      enquiryDate: this.enquiryDate,
      status: this.status
    });

    alert('Task created');
    this.taskDetail = '';
    this.assignedTo = '';
    this.enquiryDate = '';
    this.status = 'pending';
  }
}
