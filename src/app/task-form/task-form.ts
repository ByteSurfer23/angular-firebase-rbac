import { Component, OnInit } from '@angular/core'; // Removed Input as orgId is not an input
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// Ensure the path to your auditlogentry file is correct
import { logAuditActionWithSetDoc } from '../auditlogentry/auditlogentry'; 

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './task-form.html', // Ensure this HTML file exists
})
export class TaskFormComponent implements OnInit {
  // Removed @Input() orgId! parameter as per your instruction
  // orgId will be retrieved directly from localStorage when needed

  taskDetail = '';
  enquiryDate = '';
  status = 'pending';
  assignedTo: string[] = []; // Initialize as empty array for multi-select
  reminderDate = '';
  users: any[] = []; // To hold users for assignment dropdown/checkboxes

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    const orgId = localStorage.getItem('orgId'); // Get orgId from localStorage
    
    if (!orgId) {
      console.error("Organization ID is missing in localStorage. Cannot fetch users for task assignment.");
      return;
    }

    try {
      const usersRef = collection(this.firestore, `organizations/${orgId}/users`); // Use orgId from localStorage
      const snap = await getDocs(usersRef);
      // Map user documents to include their UID (doc.id) for assignment
      this.users = snap.docs.map(doc => ({ uid: doc.id, name: doc.data()['name'] || 'Unknown User' }));
      console.log('Users fetched for assignment:', this.users);
    } catch (error) {
      console.error('Error fetching users for assignment:', error);
    }
  }

  async submitTask() {
    // Get the UID of the user performing this action (e.g., the user creating the task)
    const actorUid = localStorage.getItem('uid') || 'anonymous'; 
    const initialTaskDetailForLog = this.taskDetail; // Capture for potential failure log
    
    const orgId = localStorage.getItem('orgId'); // Get orgId from localStorage for this method
    
    // Basic validation for orgId before proceeding

    try {
      // Use orgId from localStorage for the Firestore path
      const tasksCollectionRef = collection(this.firestore, `organizations/${orgId}/tasks`);
      
      // Use addDoc to create a new document and capture the DocumentReference
      const newDocRef = await addDoc(tasksCollectionRef, {
        taskDetail: this.taskDetail,
        assignedTo: this.assignedTo,
        createdAt: new Date(), // Use new Date() for local timestamp, Firestore will convert
        enquiryDate: this.enquiryDate,
        status: this.status,
        reminderDate : this.reminderDate,
      });

      // Get the automatically generated UID (document ID) for the new task
      const newTaskId = newDocRef.id;
      alert(`Task created successfully with ID: ${newTaskId}`);

      // Log successful task creation audit action
      logAuditActionWithSetDoc(
        this.firestore, 
        actorUid,
        'task_creation',
        `task_${newTaskId}`, // Resource: The unique ID of the created task
        'success'
      );

      console.log('Task created successfully!'); // Replaced alert

      // Reset form fields after successful submission
      this.taskDetail = '';
      this.assignedTo = [];
      this.enquiryDate = '';
      this.status = 'pending';
      this.reminderDate = '';

    } catch (error: any) {
      console.error('Error creating task:', error); // Use console.error for better visibility
      
      // Log failed task creation audit action
      logAuditActionWithSetDoc(
        this.firestore, 
        actorUid,
        'task_creation',
        `temp_task_${initialTaskDetailForLog.substring(0, 20)}`, // Resource: Use a truncated detail or placeholder for failed creation
        'failed',// Optional details
      );

      alert('Failed to create task.'); // Replaced alert
    }
  }
}
