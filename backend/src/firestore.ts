import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Credentials come from Application Default Credentials (ADC):
// locally from `gcloud auth application-default login`, on Cloud Run from the service account
const adminApp = initializeApp({
  credential: applicationDefault(),
  projectId: 'queueup-clinic',
});

// The "(default)" Firestore database. The Admin SDK is NOT limited by Security Rules.
export const db = getFirestore(adminApp);
