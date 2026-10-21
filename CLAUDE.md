# CLAUDE.md — QueueUp (read this first)

Handoff + working agreement for any Claude session on this repo. The full plan lives in `PROJECT.md` (scope, stack, data model, timeline, checklist) — read it too. If the two disagree, `PROJECT.md` wins.

## Project in one paragraph

QueueUp is Cătălin's **master's dissertation project** (Faculty of Mathematics and Computer Science, *Internet Technologies*, taught in English; deadline June–July 2027; under 5 hours/week). A virtual queue for medical clinics: patients join via QR code, see live position, get push notifications and ask an AI assistant that answers from real queue data; reception manages the queue; a TV in the waiting room shows ticket numbers. Stack: Angular + Material (frontend), Node/Express/TypeScript (backend), Firebase Firestore + Auth + FCM, Python/FastAPI (ML service only), Docker, Cloud Run, Terraform, GitHub Actions — **GCP only**.

## How to work with Cătălin (important)

- **Chat in Romanian. Code, file names, comments, commit messages and docs in English.**
- **Teaching mode by default.** He writes the code by hand to understand it. Do NOT create or edit project files on your own. Give the code in the reply, then explain it **line by line at beginner level** (don't assume knowledge of syntax or library conventions). Put short inline comments in the code itself (`//` in TypeScript, `#` in Python).
- One small step at a time; wait for his output or screenshot before moving on. He often sends screenshots of terminal/VS Code — read them carefully.
- Explain *why*, not just *what* (e.g. why a flag exists, what a command does).
- If he explicitly says "do it yourself" for a task, you may edit files — on a feature branch, never straight to `main`, and tell him what changed.
- Be honest about trade-offs; if something may be outdated (library versions, pricing, setup steps), check current docs instead of guessing.

## Conventions

- Commit after each completed logical chunk; feature branches (`feature/...`) once past initial setup. Ask before pushing.
- Never commit secrets (`.env`, service-account / firebase-adminsdk JSON, `*.tfstate`) — already covered by the root `.gitignore`.
- Every Firestore document carries `clinicId`, even with a single clinic.
- Privacy by design: no phone numbers, no medical data; the TV display shows **ticket numbers only, never names**.
- The AI assistant handles logistics only (position, wait time, opening hours, cancellation). Symptoms or medical advice → polite redirect to staff.

## Decisions already made (don't reopen without a reason)

- Angular 22 (CLI 22.0.4), standalone components, **plain CSS** (not SCSS for own styles), no SSR. Angular Material with the Azure/Blue theme.
- Firebase **Hosting** (SPA), not App Hosting. GCP only, no Azure.
- **No `@angular/fire`.** Use the official modular `firebase` JS SDK directly, wrapped in our own Angular services; `Timestamp` comes from `firebase/firestore`. Reason: no AngularFire release supports Angular 22 (Oct 2026), and downgrading Angular was rejected (Angular 20 support ends Nov 2026). Revisit only if a *stable* AngularFire 22 ships — check npm first. Details in `PROJECT.md` §2.
- TypeScript everywhere; Python only for `ml-service/` (simulator + wait-time prediction). Cătălin is a beginner in Python.
- Monorepo: `frontend/`, `backend/`, `ml-service/`, `infra/`, `docs/`, `.github/workflows/`.
- Routing: `''` redirects to `queue`; `queue` renders `PatientQueue` (`frontend/src/app/pages/patient-queue/`). `app.html` contains only `<router-outlet>`.
- Core scope includes QR join links and the TV display page. Pub/Sub, multi-clinic and the admin analytics assistant are stretch goals.

## Current state

- Done: Angular scaffold + Material, routing skeleton, GitHub repo (`catalinstefanoiu/queueup-clinic`, public, branch `main`), Firebase project `queueup-clinic`, `PROJECT.md` (dissertation version) pushed.
- **New Windows laptop is set up** (project in `D:/Projects/queueup-clinic`; terminals in VS Code: Git Bash and PowerShell): Node 24.21.0, npm 11.19.0, Angular CLI 22.0.4, gcloud 590.0.0 linked to `queueup-clinic`; `npm install` + `ng serve` work. Docker, Firebase CLI, Python, Terraform and k6 are not installed yet — install when needed.
- `ng serve` must be run from `frontend/` (that's where `angular.json` lives). `npm install` warns about 31 audit vulnerabilities and blocked install scripts (npm 11 `allowScripts`); both are non-blocking for now — review `npm audit` before the first deploy, and don't run `npm audit fix --force`.
- `gcloud init` printed a Compute Engine API error — harmless, we don't use VMs. Don't enable that API.
- Known, unresolved, non-blocking: VS Code shows 2 TypeScript 6 warnings in `tsconfig.app.json` / `tsconfig.spec.json` ("`rootDir` must be explicitly set"). The app builds and runs.
- `frontend/.claude/CLAUDE.md` holds Angular's official best-practice rules (signals, `@if`/`@for`, `inject()`, etc.). Follow them for Angular code, but this root file's teaching-mode rules take priority.

## Next steps (in order)

1. Connect the app to Firebase with the `firebase` JS SDK (branch `feature/firebase-setup`): register the web app in Firebase Console → get `firebaseConfig` → install `firebase` → initialize it in the app. Do this **before** the model files, since they import `Timestamp` from `firebase/firestore`.
2. Create the models in `frontend/src/app/models/` exactly as in `PROJECT.md` §5 (`Clinic`, `Service`, `QueueEntry`; ticket numbers, `clinicId`, no phone number — this supersedes any earlier draft).
3. Patient join page with live position, then QR join links, then staff Auth and the admin dashboard. After that follow the timeline in `PROJECT.md` §6.
4. Dissertation proposal for the coordinator (one page, English) — **postponed** until Cătălin finds a coordinator; he's still looking and chose to start on the app first.

Keep `PROJECT.md` §7 (checklist) updated as steps are completed, and keep a short work log in `docs/` — it becomes raw material for the dissertation.
