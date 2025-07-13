// src/app/project-chat/project-chat.component.ts

import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { ChatMessage } from '../models/models';

@Component({
  selector: 'app-project-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  providers: [DatePipe],
  template: `
    <div class="chat-container bg-white rounded-xl shadow-lg border-2 border-gray-300 p-4 flex flex-col h-full">
      <h3 class="text-xl font-bold text-center text-custom-gradient mb-4">
        Project Chat
        <span *ngIf="projectId" class="text-blue-600"> (Project ID: {{ projectId }})</span>
      </h3>

      <div #chatMessages class="messages-display flex-grow overflow-y-auto custom-scrollbar p-2 border border-gray-200 rounded-lg bg-gray-50 mb-4">
        <div *ngIf="messages.length === 0" class="text-center text-gray-500 py-4">
          No messages yet. Start the conversation!
        </div>
        <div *ngFor="let message of messages" class="mb-2">
          <div
            [ngClass]="{
              'text-right': message.senderId === currentUserId,
              'text-left': message.senderId !== currentUserId
            }"
          >
            <span
              [ngClass]="{
                'bg-blue-500 text-white': message.senderId === currentUserId,
                'bg-gray-200 text-gray-800': message.senderId !== currentUserId
              }"
              class="inline-block p-2 rounded-lg max-w-[80%] break-words shadow-sm"
            >
              <strong class="block text-sm font-semibold">{{ message.senderEmail }}</strong>
              <span class="text-sm">{{ message.messageText }}</span>
              <span class="block text-xs opacity-75 mt-1">{{ message.timestamp | date:'shortTime' }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="message-input flex items-center gap-2">
        <input
          type="text"
          [(ngModel)]="newMessageText"
          placeholder="Type your message..."
          (keyup.enter)="sendMessage()"
          class="flex-grow p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus-glow transition duration-250 ease-in-out"
          [disabled]="!organizationId || !domainUid || !projectId || isSending"
        />
        <button
          (click)="sendMessage()"
          [disabled]="!organizationId || !domainUid || !projectId || !newMessageText.trim() || isSending"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 whitespace-nowrap"
        >
          {{ isSending ? 'Sending...' : 'Send' }}
        </button>
      </div>
      <div *ngIf="chatErrorMessage" class="text-red-600 text-sm mt-2 text-center">{{ chatErrorMessage }}</div>
    </div>
  `,
  styles: [`
    /* Custom styles for chat component */
    .chat-container {
      max-height: 600px; /* Adjust as needed */
      min-height: 400px;
    }
    .messages-display {
      height: 100%; /* Occupy available height */
    }
    /* Custom Scrollbar for light theme - duplicated here for component scope if needed */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #e5e7eb; /* gray-200 */
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #9ca3af; /* gray-400 */
      border-radius: 4px;
      border: 2px solid #e5e7eb; /* gray-200 */
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #6b7280; /* gray-500 */
    }
    /* Custom Gradient for text */
    .text-custom-gradient {
      background: linear-gradient(
        to right,
        #ffea00,
        #ff1493
      ); /* Bright Yellow to Hot Pink */
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
      display: inline-block;
    }
    .input-focus-glow:focus {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5); /* Blue glow */
      outline: none;
    }
  `],
})
export class ProjectChatComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() organizationId: string | null = null;
  @Input() domainUid: string | null = null;
  @Input() projectId: string | null = null;
  @Input() currentUserId: string | null = null; // UID of the currently logged-in user
  @Input() currentUserEmail: string | null = null; // Email of the currently logged-in user

  messages: ChatMessage[] = [];
  newMessageText: string = '';
  chatErrorMessage: string | null = null;
  isSending: boolean = false;

  // decorator selects the chatMessages template part of html 
  // private - defines the attribute accessibility 
  // ElementRef defines the type of the attribute
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef; 

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Initial subscription if all IDs are available on init
    if (this.organizationId && this.domainUid && this.projectId) {
      this.subscribeToMessages(this.organizationId, this.domainUid, this.projectId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If any of the IDs change, re-subscribe to messages
    if (
      (changes['organizationId'] && changes['organizationId'].currentValue !== changes['organizationId'].previousValue) ||
      (changes['domainUid'] && changes['domainUid'].currentValue !== changes['domainUid'].previousValue) ||
      (changes['projectId'] && changes['projectId'].currentValue !== changes['projectId'].previousValue)
    ) {
      if (this.organizationId && this.domainUid && this.projectId) {
        this.messages = []; // Clear messages when project changes
        this.subscribeToMessages(this.organizationId, this.domainUid, this.projectId);
      } else {
        this.messages = []; // Clear messages if any required ID is missing
      }
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private subscribeToMessages(organizationId: string, domainUid: string, projectId: string): void {
    this.chatService.getProjectMessages(organizationId, domainUid, projectId, 50).subscribe({ // Limit to last 50 messages for performance
      next: (msgs) => {
        this.messages = msgs;
        this.chatErrorMessage = null;
      },
      error: (err) => {
        console.error('ProjectChatComponent: Error fetching chat messages:', err);
        this.chatErrorMessage = 'Failed to load chat messages.';
      },
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.organizationId || !this.domainUid || !this.projectId || !this.currentUserId || !this.currentUserEmail || !this.newMessageText.trim()) {
      this.chatErrorMessage = 'Please ensure all project and user info is available and enter a message.';
      return;
    }

    this.isSending = true;
    this.chatErrorMessage = null; // Clear previous errors

    try {
      await this.chatService.sendMessage(
        this.organizationId,
        this.domainUid,
        this.projectId,
        this.currentUserId,
        this.currentUserEmail,
        this.newMessageText
      );
      this.newMessageText = ''; // Clear input on success
      // Messages will automatically update via the real-time subscription
    } catch (error) {
      this.chatErrorMessage = 'Failed to send message. Please try again.';
      console.error('ProjectChatComponent: Error sending message from component:', error);
    } finally {
      this.isSending = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Handle error if element is not available (e.g., component not fully rendered)
      console.warn('ProjectChatComponent: Could not scroll chat to bottom:', err);
    }
  }
}
