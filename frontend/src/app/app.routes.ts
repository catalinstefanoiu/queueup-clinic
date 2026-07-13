import { Routes } from '@angular/router';
import { PatientQueue } from './pages/patient-queue/patient-queue';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'queue',
    pathMatch: 'full',
  },
  {
    path: 'queue',
    component: PatientQueue,
  },
];