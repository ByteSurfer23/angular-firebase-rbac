import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
} from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-task.html',
})
export class EditTaskComponent implements OnInit {
  orgId = '';
  taskId = '';
  task: any = {
    assignedTo: [], // Ensure this is always an array
  };
  users: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.taskId = this.route.snapshot.paramMap.get('id') || '';
    this.orgId = localStorage.getItem('orgId') || '';

    const taskRef = doc(this.firestore, `organizations/${this.orgId}/tasks/${this.taskId}`);
    const taskSnap = await getDoc(taskRef);
    this.task = taskSnap.data() || { assignedTo: [] };

    // Ensure assignedTo is an array
    if (!Array.isArray(this.task.assignedTo)) {
      this.task.assignedTo = this.task.assignedTo ? [this.task.assignedTo] : [];
    }

    const usersRef = collection(this.firestore, `organizations/${this.orgId}/users`);
    const userSnap = await getDocs(usersRef);
    this.users = userSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  toggleUserAssignment(uid: string) {
    const index = this.task.assignedTo.indexOf(uid);
    if (index > -1) {
      this.task.assignedTo.splice(index, 1);
    } else {
      this.task.assignedTo.push(uid);
    }
  }

  isUserAssigned(uid: string): boolean {
    return this.task.assignedTo.includes(uid);
  }

  async updateTask() {
    const task_id_copy = this.taskId;
    const uid = localStorage.getItem('uid');
    try{
    const taskRef = doc(this.firestore, `organizations/${this.orgId}/tasks/${this.taskId}`);
    await updateDoc(taskRef, this.task);
    logAuditActionWithSetDoc(
      this.firestore,
      uid || '',
      'task_edit',
      `task_${task_id_copy}`,
      'success'

    );
    alert('Task updated successfully');
    this.router.navigate(['/dashboard']);}
    catch(error){
      console.log(error);
    }
  }
}
