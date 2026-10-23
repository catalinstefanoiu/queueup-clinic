// A clinic using QueueUp. Stored in the "clinics" collection.

export interface Clinic {
  id: string; // Firestore document ID (not stored inside the document)
  name: string;
  address: string;
  openingHours: string; // e.g. "Mon–Fri 08:00–16:00" — used by the AI assistant
}
