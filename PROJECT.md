# QueueUp — Intelligent Virtual Queue Management for Clinics

**Master's dissertation project** — Faculty of Mathematics and Computer Science, *Internet Technologies* (English) program.

Patients join a clinic's virtual queue from their phone (by scanning a QR code), follow their position live, get a push notification when their turn is near, and can ask an AI assistant that answers from real queue data. Reception staff manage the queue from a dashboard, and a TV screen in the waiting room shows who is being called.

Domain: **medical clinic** (waiting room replacement). The AI assistant is scoped strictly to logistics (position, wait time, opening hours, cancellations) — never medical advice.

---

## 1. Dissertation framing

**Working title:** *QueueUp: A Cloud-Native, Real-Time Virtual Queue System for Clinics with Wait-Time Prediction and an LLM-Based Assistant*

**Core focus (Internet Technologies):** real-time web application, microservice architecture, cloud deployment, infrastructure as code, LLM integration through web APIs.

**Research contributions (measurable — these become the evaluation chapter):**

1. **Wait-time prediction** — compare a baseline (`position × average service duration`) against an ML model trained on simulated data. Metric: mean absolute error (MAE).
2. **Grounded AI assistant** — a test set of patient questions; measure answer correctness *with* tool-calling vs. *without* access to real data, and the correct-refusal rate for medical questions.
3. **Scalability & real-time performance** — load tests (k6) on Cloud Run: latency, throughput, autoscaling behaviour, and how fast queue updates reach clients.

**Data source:** a discrete-event **clinic simulator** (arrivals, service durations, no-shows, priority patients) — no real patient data is needed or used.

**Constraints:**
- Deadline: **June–July 2027**
- Available time: **under 5 hours/week** (~170 hours total, ~40 of them for writing)
- Dissertation written in English (confirm with the faculty)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular (standalone components) + TypeScript + Angular Material, PWA |
| Backend API | Node.js + Express + TypeScript (containerized microservice) |
| ML service | Python + FastAPI (simulator + wait-time prediction) |
| Database | Firebase Firestore (real-time listeners) |
| Auth | Firebase Auth (staff accounts) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| AI | Claude API with tool-calling + streaming |
| Containerization | Docker |
| Hosting (frontend) | Firebase Hosting (SPA) |
| Hosting (services) | Google Cloud Run |
| Infrastructure as Code | Terraform (GCP) |
| CI/CD | GitHub Actions |
| Load testing | k6 |

Cloud provider: **GCP only**. Languages: **TypeScript everywhere, Python only for the ML service.**

**Firebase access from Angular:** the official modular `firebase` JS SDK, wrapped in small hand-written Angular services — **not** `@angular/fire`. Decided Oct 2026: AngularFire had no release supporting Angular 22 (latest stable 20.1.1 requires Angular 20; 21.0.0 was only a release candidate), and downgrading was rejected because Angular 20 support ends Nov 2026. See angular/angularfire issues #3696 and #3737.

**Data flow:** writes go through the Express backend (Firebase Admin SDK) — ticket numbering, joining, calling the next patient, cancelling — so business rules can't be bypassed by the client. Live reads go straight from Angular to Firestore with real-time listeners (`onSnapshot`), protected by Security Rules.

**Firestore database:** `(default)`, Standard edition, location **`europe-west4` (Netherlands)** — permanent, it can't be changed later. A regional location (not the `eur3` multi-region) keeps per-operation costs low, which matters for load tests. `europe-west4` is a Cloud Run Tier 1 (cheapest) region, so the backend will be deployed there too for low latency. Created in **production mode**: all client reads/writes are denied until we write Security Rules; the backend (Admin SDK) is not affected by the rules. The first database in a project gets the free quota (50k reads, 20k writes, 1 GiB storage per day).

---

## 3. Repository

- GitHub: `catalinstefanoiu/queueup-clinic`
- Structure: monorepo, each folder independently deployable

```
queueup-clinic/
├── frontend/         → Angular app (patient, admin, TV display)
├── backend/          → Express API + AI assistant logic
├── ml-service/       → Python: simulator + prediction model (FastAPI)
├── infra/            → Terraform (GCP resources)
├── docs/             → dissertation notes, experiment results, diagrams
└── .github/
    └── workflows/    → GitHub Actions (CI/CD)
```

---

## 4. Features

### 4.1 Patient (public, mobile-first)
- Scan the **QR code** at reception → opens the join page with clinic and service pre-filled
- Join the queue for a service, receive a **ticket number** (e.g. `C-012`)
- See live position and estimated wait time
- **Push notification** when 2 people are ahead, and when called
- Cancel their spot
- Chat with the AI assistant

### 4.2 Reception / admin (authenticated)
- Live queue per service
- Call next / mark served / mark no-show
- Add walk-in patients, flag priority patients
- Basic stats (patients today, average wait)

### 4.3 Waiting-room TV display (`/display`)
- Full-screen page on a TV: "Now serving: **C-012** → Room 2" + the next tickets
- Shows **ticket numbers only, never names** (privacy by design)
- Updates live from Firestore

### 4.4 AI assistant
- Patient-facing chat, streamed responses
- **Tool-calling**: fetches the patient's real position, estimated wait, and clinic hours from the backend instead of guessing
- Out of scope: symptoms, diagnoses, medical advice → polite redirect to staff

### 4.5 Wait-time prediction (ML service)
- Simulator generates realistic queue histories
- Model trained on them; served via FastAPI and called by the Express backend
- Evaluated against the baseline (see §1)

### 4.6 Stretch goals (only if time remains)
- Multi-clinic support (SaaS-style, isolation through Firestore security rules)
- Event-driven communication with Pub/Sub
- Second AI surface for admins (natural-language analytics)

---

## 5. Data Model (Firestore)

All documents carry a `clinicId`, even with a single clinic — so multi-clinic support stays possible without migrating data later.

```typescript
import { Timestamp } from 'firebase/firestore';

interface Clinic {
  id: string;
  name: string;
  address: string;
  openingHours: string;          // e.g. "Mon–Fri 08:00–16:00" — used by the AI assistant
}

interface Service {
  id: string;
  clinicId: string;
  name: string;                  // e.g. "General Consultation"
  ticketPrefix: string;          // e.g. "C" → tickets C-001, C-002...
  averageDurationMinutes: number;
  isActive: boolean;
}

type QueueStatus = 'waiting' | 'called' | 'served' | 'cancelled' | 'no-show';

interface QueueEntry {
  id: string;
  clinicId: string;
  serviceId: string;
  ticketNumber: number;          // daily sequence per service, shown as "C-012"
  patientName: string;           // visible to staff only, never on the TV display
  status: QueueStatus;
  isPriority: boolean;
  notes?: string;
  addedBy: 'patient' | 'admin';
  notificationToken?: string;    // FCM device token, only if the patient allows notifications
  joinedAt: Timestamp;
  calledAt?: Timestamp;
  servedAt?: Timestamp;
}
```

- Position in queue is **computed**, never stored.
- **Data minimization (GDPR):** no phone number, no medical data, no account needed for patients.

---

## 6. Timeline

| Period | Work |
|---|---|
| **Oct–Nov 2026** | Connect Firebase · Express backend skeleton · first vertical slice: patient joins through the backend (ticket numbering) + live position from Firestore · staff Auth |
| **Dec 2026–Jan 2027** | Admin dashboard (call next / served / no-show through the backend) · QR join links · TV display page · Docker + first Cloud Run deploy · winter break = catch-up buffer |
| **Feb 2027** | PWA + push notifications (FCM) · start AI assistant |
| **Mar 2027** | Finish AI assistant · Python simulator + prediction service |
| **Apr 2027** | Terraform · GitHub Actions · all experiments (prediction, assistant, load tests) |
| **May–Jun 2027** | Writing · buffer for the unexpected |

Frontend and backend are built **in parallel, one vertical slice at a time** (each feature goes through Angular → Express → Firestore before starting the next), so every layer is learned end to end and no throwaway client-side logic is written. The coordinator proposal is sent as soon as a coordinator is found.

If behind schedule: simplify push notifications first (in-app alert while the page is open), then reduce the experiment scope — never the core app.

---

## 7. Progress checklist

**Setup**
- [x] Angular project scaffolded (CSS, no SSR) + Angular Material (Azure/Blue)
- [x] Monorepo + Git, pushed to GitHub
- [x] Routing skeleton (`/queue` → `PatientQueue`)
- [x] Firebase project + gcloud CLI configured
- [ ] Dissertation proposal sent to coordinator

**Core app**
- [x] Firebase JS SDK (`firebase`) installed and connected · Firestore database created (`europe-west4`)
- [ ] Backend skeleton (Express + TypeScript, `GET /health`) + Firebase Admin SDK via Application Default Credentials
- [ ] Data model files (`Clinic`, `Service`, `QueueEntry`)
- [ ] Patient join (`POST /queue/join` + join page) + live position
- [ ] QR code join links
- [ ] Staff Auth + admin dashboard
- [ ] TV display page

**Backend & cloud**
- [ ] Express API complete: call next, served / no-show, cancel
- [ ] Docker + Cloud Run deploy
- [ ] PWA + push notifications (FCM)
- [ ] AI assistant with tool-calling
- [ ] Python simulator + prediction service (FastAPI)
- [ ] Terraform for all GCP resources
- [ ] GitHub Actions: lint → test → build → deploy

**Evaluation & writing**
- [ ] Prediction experiment (model vs. baseline)
- [ ] Assistant evaluation (test question set)
- [ ] Load tests with k6
- [ ] Architecture diagram + demo recording
- [ ] Dissertation written

---

## 8. Conventions

- All code, file names, comments and documentation: **English**. Chat with Claude: Romanian.
- Code is written by hand, step by step, with beginner-level explanations — no editor AI generating code.
- Keep a short **work log** in `docs/` (decisions, problems, experiment results) — it becomes raw material for the dissertation.
- Commit after each completed logical chunk; feature branches for larger features (`feature/push-notifications`, `feature/ai-assistant`...).
- GCP only. Firebase Hosting (SPA), not App Hosting.

---

## 9. Local environment (confirmed working)

New Windows laptop (Oct 2026), project in `D:/Projects/queueup-clinic`:

- Node.js v24.21.0 · npm 11.19.0 · Angular CLI 22.0.4
- gcloud CLI 590.0.0 linked to project `queueup-clinic`
- `npm install` + `ng serve` in `frontend/` working (`localhost:4200/queue`)
- To install later: Docker, Python 3, Firebase CLI, Terraform, k6

---

*Living document — update it whenever a decision changes or a step is completed.*
