import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, getDocs, collection } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-task.html'
})
export class EditTaskComponent implements OnInit {
  orgId = ''; // Pass from route or localStorage
  taskId = '';
  task: any = {};
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
    this.task = taskSnap.data();

    const usersRef = collection(this.firestore, `organizations/${this.orgId}/users`);
    const userSnap = await getDocs(usersRef);
    this.users = userSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  async updateTask() {
    const taskRef = doc(this.firestore, `organizations/${this.orgId}/tasks/${this.taskId}`);
    await updateDoc(taskRef, this.task);
    alert('Task updated');
    this.router.navigate(['/dashboard']);
  }
}
