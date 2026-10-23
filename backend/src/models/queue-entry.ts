// One patient's place in a queue. Stored in the "queueEntries" collection.

import type { Timestamp } from 'firebase-admin/firestore';

export type QueueStatus = 'waiting' | 'called' | 'served' | 'cancelled' | 'no-show';

export interface QueueEntry {
  id: string; // Firestore document ID
  clinicId: string;
  serviceId: string;
  ticketNumber: number; // daily sequence per service, shown as "C-012"
  patientName: string; // visible to staff only, never on the TV display
  status: QueueStatus;
  isPriority: boolean;
  notes?: string;
  addedBy: 'patient' | 'admin';
  notificationToken?: string; // FCM device token, only if the patient allows notifications
  joinedAt: Timestamp;
  calledAt?: Timestamp;
  servedAt?: Timestamp;
}
