// A service offered by a clinic (e.g. "General Consultation"). Stored in the "services" collection.

export interface Service {
  id: string; // Firestore document ID
  clinicId: string; // which clinic offers it
  name: string;
  ticketPrefix: string; // e.g. "C" → tickets C-001, C-002...
  averageDurationMinutes: number;
  isActive: boolean;
}
