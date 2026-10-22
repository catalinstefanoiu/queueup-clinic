// Imports: Angular's decorator, the two Firebase functions we need, and our config
import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebase.config';

// providedIn: 'root' = Angular creates ONE shared instance for the whole app
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  // Connects this app to our Firebase project (runs once, when the service is created)
  private readonly app = initializeApp(firebaseConfig);

  // Entry point for reading and writing Firestore documents
  readonly db = getFirestore(this.app);
}