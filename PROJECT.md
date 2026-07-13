# QueueUp — Virtual Queue Management System for Clinics

A portfolio project: patients join a virtual queue remotely, track their position in real time, and get help from an AI assistant that can actually check real queue data. Admin staff manage the queue from a dedicated dashboard.

Domain chosen: **medical clinic** (waiting room replacement). The AI assistant is scoped strictly to logistics (position, wait time, schedule, cancellations) — never medical advice.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular (standalone components) + TypeScript + Angular Material |
| Backend | Node.js + Express + TypeScript (containerized microservice) |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| AI | Claude API with tool-calling + streaming |
| Containerization | Docker |
| Hosting (frontend) | Firebase Hosting |
| Hosting (backend) | Google Cloud Run |
| Infrastructure as Code | Terraform (GCP) |
| CI/CD | GitHub Actions |

Cloud provider: **GCP only** (Firebase is built on GCP — keeps IaC and credentials unified, no Azure).

---

## 2. Repository

- GitHub: `catalinstefanoiu/queueup-clinic`
- Structure: monorepo

```
queueup-clinic/
├── frontend/         → Angular app
├── backend/          → Express API + AI assistant logic
├── infra/            → Terraform (GCP resources)
└── .github/
    └── workflows/    → GitHub Actions (CI/CD)
```

Each folder is independently deployable (separate `package.json` for frontend/backend, no shared root dependencies).

---

## 3. Core Features

### 3.1 Patient side (Angular — public-facing)
- Join a queue for a chosen service (e.g. general consultation, blood test) without an account (or lightweight auth — TBD)
- See live position in queue and estimated wait time
- Get notified when it's almost their turn
- Cancel their spot
- Chat with the AI assistant ("how long left?", "can I cancel?")

### 3.2 Admin side (Angular — authenticated, reception staff)
- View the live queue for the clinic
- Call the next patient / mark as served
- Add walk-in patients manually
- See basic stats (people waited today, average wait time)

### 3.3 AI Assistant (core differentiator)
- Lives in the patient-facing chat
- Uses **tool-calling**: instead of guessing, it calls real backend endpoints to fetch the patient's actual queue position, estimated wait, and clinic hours
- Streams responses
- Strictly out of scope: symptoms, diagnoses, medical advice — politely redirects those to staff
- Stretch goal (phase 2): a second AI surface for admins — natural-language analytics ("how many people waited over 30 min today?")

---

## 4. Data Model (draft — Firestore)

**QueueEntry**
```typescript
interface QueueEntry {
  id: string;
  patientName: string;
  service: string;           // e.g. "general-consultation", "blood-test"
  status: 'waiting' | 'called' | 'served' | 'cancelled';
  joinedAt: Timestamp;
  calledAt?: Timestamp;
  servedAt?: Timestamp;
}
```
Position in queue is **computed** (based on order + status), not stored directly — avoids stale data as people move through.

*(To be expanded when we design Firestore collections in detail.)*

---

## 5. Build Roadmap

- [x] Angular project scaffolded (`ng new`, CSS, no SSR)
- [x] Angular Material added (Azure/Blue theme)
- [x] Monorepo + Git initialized, pushed to GitHub
- [x] Basic routing skeleton (`/queue` → `PatientQueue` component)
- [ ] Define Firestore data model in full
- [ ] Build patient queue UI (join form, live position view)
- [ ] Firebase Auth (admin login)
- [ ] Build admin dashboard UI
- [ ] Backend: Express API skeleton
- [ ] Backend: queue logic endpoints (join, position, call next, cancel)
- [ ] Connect frontend ↔ backend ↔ Firestore, real-time updates
- [ ] AI assistant: Claude API integration with tool-calling
- [ ] Dockerize backend
- [ ] Terraform: provision Cloud Run, IAM, service accounts
- [ ] GitHub Actions: lint → test → build → deploy pipeline
- [ ] Multi-environment setup (dev/prod)
- [ ] Observability (Cloud Logging/Monitoring, basic alerts)
- [ ] Polish: README, architecture diagram, demo recording

---

## 6. Explicit decisions & conventions

- All code, file names, and comments: **English**. Chat/discussion with Claude: Romanian is fine.
- GCP only, no multi-cloud.
- No AI-generated code from editor tools for learning purposes — code is written by hand with explanations, step by step.
- Firebase Hosting (SPA) for frontend — not Firebase App Hosting (no SSR needed).
- Git workflow: commit after each completed logical chunk; feature branches once we move past initial setup.

---

## 7. Local Dev Environment (confirmed working)

- Node.js v24.15.0
- Angular CLI 22.0.4
- Docker v29.5.3
- gcloud CLI (linked to project `queueup-clinic`)
- Firebase project created: `queueup-clinic`

---

*This file is a living document — update it as decisions change or features are completed.*
