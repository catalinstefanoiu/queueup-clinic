// Seed script: creates the demo clinic and its first service in Firestore.
// Safe to run many times: fixed document IDs mean it overwrites instead of duplicating.
import { db } from '../firestore.ts';
import type { Clinic } from '../models/clinic.ts';
import type { Service } from '../models/service.ts';

// Fixed IDs, so we always know where the demo data lives
const CLINIC_ID = 'demo-clinic';
const SERVICE_ID = 'general-consultation';

// The document data: everything except "id" (the ID is the document's name, not a field)
const clinic: Omit<Clinic, 'id'> = {
  name: 'QueueUp Demo Clinic',
  address: 'Str. Exemplului 1, Bucharest',
  openingHours: 'Mon–Fri 08:00–16:00',
};

const service: Omit<Service, 'id'> = {
  clinicId: CLINIC_ID,
  name: 'General Consultation',
  ticketPrefix: 'C',
  averageDurationMinutes: 15,
  isActive: true,
};

// set() creates the document, or replaces it if it already exists
await db.collection('clinics').doc(CLINIC_ID).set(clinic);
await db.collection('services').doc(SERVICE_ID).set(service);

console.log(`Seeded clinic "${CLINIC_ID}" and service "${SERVICE_ID}"`);
