// src/app/models/project.model.ts

import { Timestamp } from '@angular/fire/firestore';

/**
 * Represents a single asset (document or image) associated with a project.
 */
export interface ProjectAsset {
  key: string; // e.g., "Architectural Diagram", "Meeting Minutes"
  url: string; // URL to the hosted image or document
}

export interface UserWithAssetAccess {
  uid: string;
  email: string;
  fileAccesses: UserProjectAssetAccess[];
  projectAssignments: UserProjectAssignment[]; // Added this property
}
export interface UserProjectAssignment {
  projectId: string;
  taskIds: string[]; // An array of task UIDs within that project the user is assigned to.
                      // For this component, it will be an empty array if only project assignment is handled.
}
/**
 * Represents a user assigned to a project or a task within a project.
 */
export interface AssignedUser {
  uid: string; // The Firebase Authentication User ID
  email: string; // The email address of the user
}

export interface UserAssignedTask {
  projectId: string;
  taskId: string;
}

export interface UserProjectAssetAccess {
  projectId: string;
  assetKey: string;
  hasAccess: boolean;
}
/**
 * Represents a single task within a project.
 */
export interface ProjectTask {
  id: string;
  description: string; // Description of the task
  dueDate: Timestamp ; // The date the task is due
  reminderDate: Timestamp | undefined; // Optional reminder date for the task
  createdAt: Timestamp; // The date and time the task was created
  status: 'not yet started' | 'in progress' | 'completed'; // Current status of the task
  assignedTo: AssignedUser[]; // An array of users assigned to this specific task
}

/**
 * Represents a complete project document stored in Firestore.
 */
export interface ProjectDocument {
  uid: string; // The unique ID of the project document (usually Firestore's doc.id)
  name: string; // The name of the project
  description: string; // A detailed description of the project
  orgId: string; // The ID of the organization this project belongs to
  domainUid: string; // The UID of the domain this project is associated with
  createdBy: { // Information about the admin who created the project
    uid: string;
    email: string;
  };
  assets: ProjectAsset[]; // Array of associated assets (documents/images)
  usersWorkingOnProject: AssignedUser[]; // Array of users who are part of this project
  tasks: ProjectTask[]; // Array of tasks defined for this project
  createdAt: Timestamp; // The date and time the project was created
  isActive: boolean; // Flag indicating if the project is currently active
}