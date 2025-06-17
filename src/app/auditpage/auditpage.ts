// src/app/audit-log-viewer/audit-log-viewer.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for *ngIf, *ngFor
import { Firestore, collection, query, onSnapshot } from '@angular/fire/firestore';

// Define the interface for your audit log data structure
// This should match how your logs are stored in Firestore
interface AuditLogData {
  logId?: string; // Firestore document ID
  action: string;
  actorUid: string;
  resource: string;
  status: 'success' | 'failed' | 'no_data';
  timestampIST: string;
  organizationId?: string; // Will be present in data, but not displayed as a column
  details?: { [key: string]: any }; // Will be present in data, but not displayed as a column
}

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [CommonModule], // Import CommonModule for directives like *ngIf, *ngFor
  templateUrl: './auditpage.html',
  // Tailwind CSS classes are directly in the HTML template, so no separate .scss file is strictly needed
  styleUrls: [] // No separate SCSS file needed if using only Tailwind classes in HTML
})
export class AuditLogViewerComponent implements OnInit, OnDestroy {
  auditLogs: AuditLogData[] = [];
  isLoading = false; // Will be set to true initially, then false after first data load
  errorMessage: string | null = null;
  orgId: string | null = null; // Property to hold the organization ID

  private unsubscribeFromFirestore: (() => void) | undefined; // Function to unsubscribe from Firestore listener

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.isLoading = true; // Start loading state
    this.orgId = localStorage.getItem('orgId'); // Get orgId from localStorage

    if (!this.orgId) {
      this.errorMessage = 'Organization ID not found in local storage. Cannot fetch audit logs.';
      this.isLoading = false;
      console.error("[AuditLogViewerComponent] Organization ID is missing. Cannot fetch audit logs.");
      return; // Exit if orgId is missing
    }

    console.log(`[AuditLogViewerComponent] Setting up real-time audit log listener for organization ID: ${this.orgId}`);
    this.setupAuditLogListener();
  }

  ngOnDestroy(): void {
    console.log("[AuditLogViewerComponent] Component destroyed. Unsubscribing from audit log listener.");
    // Call the unsubscribe function when the component is destroyed to prevent memory leaks
    if (this.unsubscribeFromFirestore) {
      this.unsubscribeFromFirestore();
    }
  }

  /**
   * Sets up a real-time listener for audit logs using onSnapshot.
   */
  private setupAuditLogListener(): void {
    if (!this.orgId) {
      // This case should ideally be caught in ngOnInit, but a double-check is safe
      this.errorMessage = 'Organization ID is unavailable. Cannot set up audit log listener.';
      this.isLoading = false;
      return;
    }

    const auditLogsCollectionRef = collection(this.firestore, `organizations/${this.orgId}/auditlogs`);
    const q = query(auditLogsCollectionRef); // Fetch all documents in the subcollection

    // onSnapshot returns an unsubscribe function. Store it to call in ngOnDestroy.
    this.unsubscribeFromFirestore = onSnapshot(q,
      (querySnapshot) => {
        if (querySnapshot.empty) {
          console.log("[AuditLogViewerComponent] No audit logs found for this organization.");
          this.errorMessage = "No audit logs found for your organization.";
          this.auditLogs = []; // Clear any previous data
        } else {
          // Map the document data to your AuditLogData interface
          this.auditLogs = querySnapshot.docs.map(doc => ({
            logId: doc.id, // Capture the document ID
            action: doc.data()['action'] || 'N/A',
            actorUid: doc.data()['actorUid'] || 'N/A',
            resource: doc.data()['resource'] || 'N/A',
            status: doc.data()['status'] || 'N/A',
            timestampIST: doc.data()['timestampIST'] || 'N/A',
            // Other fields like organizationId and details are present in doc.data()
            // but not explicitly mapped as they are not displayed in the table columns.
          }));
          console.log(`[AuditLogViewerComponent] Fetched ${this.auditLogs.length} audit logs via real-time listener.`);

          // Sort logs by timestampIST (latest first) for chronological display
          this.auditLogs.sort((a, b) => {
            // Helper function to parse your "DD/MM/YYYY, HH:MM:SS" format into a Date object
            const parseDateString = (dateStr: string) => {
              const [datePart, timePart] = dateStr.split(', ');
              const [day, month, year] = datePart.split('/');
              // Note: Month is 0-indexed in Date constructor, so subtract 1
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day),
                              parseInt(timePart.substring(0,2)), parseInt(timePart.substring(3,5)), parseInt(timePart.substring(6,8)));
            };
            const dateA = parseDateString(a.timestampIST);
            const dateB = parseDateString(b.timestampIST);
            return dateB.getTime() - dateA.getTime(); // Sort descending (latest first)
          });

          this.errorMessage = null; // Clear any error once data is successfully loaded
        }
        this.isLoading = false; // Data loaded, turn off loading indicator
      },
      (error) => {
        // Callback for error handling
        this.errorMessage = `Error setting up audit log listener: ${error.message || 'An unknown error occurred.'}`;
        this.isLoading = false;
        console.error("[AuditLogViewerComponent] Error in real-time listener:", error);
      }
    );
  }
}
