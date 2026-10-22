# QueueUp — Setup Guide (step by step)

Everything done so far to set up QueueUp, in order, with the commands, the choices made and **why**. It doubles as a reusable checklist for future projects with the same stack (Angular + Node/Express + Firebase/GCP on Windows).

> Living document — updated after every completed step. Last updated: 2026-10-22.

**Contents**

1. [Tools on a new Windows machine](#1-tools-on-a-new-windows-machine)
2. [Frontend: Angular project](#2-frontend-angular-project)
3. [Running an existing clone on a new machine](#3-running-an-existing-clone-on-a-new-machine)
4. [Google Cloud CLI (gcloud)](#4-google-cloud-cli-gcloud)
5. [Firebase: connect the frontend](#5-firebase-connect-the-frontend)
6. [Firestore database](#6-firestore-database)
7. [Git workflow: branch → PR → merge](#7-git-workflow-branch--pr--merge)
8. [Backend: Node + TypeScript + Express](#8-backend-node--typescript--express)
9. [Reuse checklist for a new project](#9-reuse-checklist-for-a-new-project)

---

## 1. Tools on a new Windows machine

Terminal: **Git Bash** inside VS Code (PowerShell is also available). All commands below are for Git Bash.

| Tool | Version used | How to check |
|---|---|---|
| Node.js (LTS) | 24.21.0 | `node -v` |
| npm (comes with Node) | 11.19.0 | `npm -v` |
| Git | configured with user name + email | `git config --global user.name` |
| Angular CLI | 22.0.4 | `ng version` |
| Google Cloud CLI | 590.0.0 | `gcloud --version` |

Install later, only when needed: Docker, Firebase CLI, Python 3, Terraform, k6.

### Angular CLI

```bash
npm install -g @angular/cli@22.0.4
```

- `-g` = global: the `ng` command becomes available in every terminal, not just one project.
- `@22.0.4` pins the version the project was created with.
- If `ng` is still "command not found" afterwards, close and reopen the terminal (it reads `PATH` only at startup).
- npm may say a new major npm version is available — ignore it; don't change the toolchain without a reason.

---

## 2. Frontend: Angular project

*(Done on the previous laptop; commands reconstructed from the resulting project.)*

```bash
ng new frontend --style=css --ssr=false   # standalone components, plain CSS, no server-side rendering
cd frontend
ng add @angular/material                  # theme: Azure/Blue
ng generate component pages/patient-queue
```

Choices: Angular 22, standalone components, **plain CSS** (not SCSS) for own styles, **no SSR** (the app is hosted as a static SPA on Firebase Hosting).

Routing (`frontend/src/app/app.routes.ts`): `''` redirects to `queue`; `queue` renders `PatientQueue`. `app.html` contains only `<router-outlet>`.

Monorepo layout at the repo root: `frontend/`, `backend/`, `ml-service/`, `infra/`, `docs/`, `.github/workflows/`. The root `.gitignore` already ignores `node_modules/` (in every folder), `.env*`, service-account JSON files and Terraform state.

---

## 3. Running an existing clone on a new machine

```bash
cd frontend
npm install
ng serve
```

- `npm install` (no package name) reads `package.json` + `package-lock.json` and downloads everything into `node_modules/` (which is not in Git).
- `ng serve` must be run **inside `frontend/`** — that's where `angular.json` is. From the repo root you get: *"This command is not available when running the Angular CLI outside a workspace."*
- Open <http://localhost:4200/queue> → "patient-queue works!". Stop the server with `Ctrl+C`.

First-run prompts of `ng serve`:
- **Autocompletion** → Yes (adds a line to `~/.bashrc`).
- **Analytics** → No (Angular CLI then writes `"analytics": false` into `angular.json`; commit it).

Warnings you can ignore for now:
- **"N vulnerabilities"** — almost all in build/test tooling, not in code shipped to users. Review with `npm audit` before the first deploy. **Never run `npm audit fix --force`** (it can jump major versions and break the project).
- **`npm warn install-scripts ... not yet covered by allowScripts`** — npm 11 blocks packages' post-install scripts until approved. The app builds fine without them; approve with `npm install-scripts approve <pkg>` only if a build actually fails.

---

## 4. Google Cloud CLI (gcloud)

1. Download the official installer: <https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe>
2. Installer options: keep **Bundled Python** checked; on the last page **uncheck** "Start Google Cloud SDK Shell" and "Run gcloud init".
3. **Restart VS Code completely** (so the terminal picks up the new `PATH`), then `gcloud --version`.
4. Link it to your account and project:

```bash
gcloud init
```

- Sign in in the browser (never type the password in the terminal).
- Pick the project (`queueup-clinic`).
- An error like *"Compute Engine API has not been used in project ..."* is **harmless** — gcloud only tried to read a default VM zone. We don't use VMs; **don't enable that API**.

5. Verify:

```bash
gcloud config list
```

Expected: `account = <your email>` and `project = queueup-clinic`.

---

## 5. Firebase: connect the frontend

### Decision: official `firebase` SDK, not `@angular/fire`

As of Oct 2026 no `@angular/fire` release supports Angular 22 (latest stable 20.1.1 needs Angular 20; 21.0.0 is only a release candidate). Downgrading Angular was rejected — Angular 20 support ends Nov 2026, before the dissertation deadline. `@angular/fire` is only a wrapper around the official SDK, so we use the SDK directly through small Angular services. Before re-evaluating, check npm: `npm view @angular/fire version peerDependencies`.

### Steps

1. **Register the web app**: Firebase Console → project → ⚙️ Settings → **General** → *Your apps* → **`</>`** (Web) → nickname `queueup-web` → leave "Firebase Hosting" **unchecked** (set up later from the CLI) → **Register app**. Don't run the `npm install` shown there.
2. **Install the SDK** (in `frontend/`):

   ```bash
   npm install firebase
   ```

   Installed: `firebase` 13.1.0.
3. **Config file** `frontend/src/app/firebase.config.ts` — copy the values from the console (Settings → General → Your apps → SDK setup and configuration → *Config*):

   ```ts
   export const firebaseConfig = {
     apiKey: '...',
     authDomain: 'queueup-clinic.firebaseapp.com',
     projectId: 'queueup-clinic',
     storageBucket: 'queueup-clinic.firebasestorage.app',
     messagingSenderId: '...',
     appId: '...',
   };
   ```

   The web config is **public by design** (it ends up in every user's browser) and is safe to commit. Data is protected by Firestore Security Rules. GitHub may still email a "Google API key detected" alert — expected for Firebase web keys. Before the first deploy: restrict the key to our domains in Google Cloud Console and add App Check.

4. **Service** `frontend/src/app/services/firebase.service.ts` — creates the Firebase app once and exposes Firestore:

   ```ts
   import { Injectable } from '@angular/core';
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';
   import { firebaseConfig } from '../firebase.config';

   @Injectable({ providedIn: 'root' })
   export class FirebaseService {
     private readonly app = initializeApp(firebaseConfig);
     readonly db = getFirestore(this.app);
   }
   ```

   `providedIn: 'root'` = one shared instance for the whole app. Angular creates it only when something first injects it.

### Frontend vs backend access to Firebase

| | Frontend (Angular) | Backend (Express) |
|---|---|---|
| SDK | `firebase` (client) | `firebase-admin` |
| Identifies itself with | public `firebaseConfig` | secret credentials (local: your gcloud login; Cloud Run: service account) |
| Allowed to | only what Security Rules permit | everything (bypasses rules) |
| Used for | live reads (`onSnapshot`) | writes: ticket numbering, join, call next, cancel |

---

## 6. Firestore database

Firebase Console → **Firestore** → **Create database**:

| Step | Choice | Why |
|---|---|---|
| Edition | **Standard** | Realtime listeners, transactions, web + server SDKs. Enterprise is for advanced queries we don't need. |
| Database ID | **`(default)`** | `getFirestore(app)` connects to `(default)` when no ID is given. The first database in a project gets the free quota (50k reads, 20k writes, 1 GiB storage per day). |
| Location | **`europe-west4` (Netherlands)** — ⚠️ permanent | Regional (cheaper per operation than the `eur3` multi-region — matters for load tests). Cloud Run Tier 1 (cheapest) region, so the backend goes there too, for low latency. `europe-west3`/`europe-central2` are closer to Romania but Tier 2 on Cloud Run. |
| Security rules | **Production mode** | Denies all browser reads/writes until we write rules. Test mode would let *anyone* read and delete everything for 30 days — dangerous with a public repo. The backend (Admin SDK) isn't affected by rules. |
| Scheduled backups | skip | Needs the paid Blaze plan; the data is simulated. |

The project is on the free **Spark** plan. Cloud Run will require **Blaze** (pay-as-you-go, generous free tier) — set budget alerts when we get there.

---

## 7. Git workflow: branch → PR → merge

One feature branch per logical chunk of work; never commit straight to `main`.

```bash
git switch main
git pull                                  # start from the latest main
git switch -c feature/<name>              # -c = create the branch
# ...work...
git add <files>                           # prefer naming files over "git add ."
git commit -m "Short imperative message"
git push -u origin feature/<name>         # first push only; -u links local ↔ GitHub branch
git push                                  # every later push
```

On GitHub:
1. **Pull requests → New pull request** → base: `main` ← compare: `feature/<name>` → title + short description → **Create pull request**.
2. Merge with **Squash and merge**: all branch commits become one clean commit on `main`, named after the PR title (typos in individual commit messages disappear). The original commits stay visible in the PR forever.
3. "Delete branch" on GitHub is optional — the PR keeps the full history, and the PR page has **Restore branch**.

Back on the laptop:

```bash
git switch main
git pull
git branch -D feature/<name>              # optional; -D (force) is needed after a squash merge
```

Notes:
- `warning: LF will be replaced by CRLF` on Windows is normal (line-ending conversion), not an error.
- Commit messages, code, comments and docs: English.

History so far: PR #1 `Connect frontend to Firebase with the modular SDK` (branch `feature/firebase-setup`).

---

## 8. Backend: Node + TypeScript + Express

*In progress on branch `feature/backend-skeleton`.*

### Tooling decisions

| Tool | Version | Why |
|---|---|---|
| Express | 5.3.0 | Current major version. |
| Running TypeScript | **Node directly** (`node src/server.ts`) | Node 24 strips types natively — stable since v24.12, no build step, no `tsx`. Node does **not** type-check. |
| TypeScript | ~6.0.3 | Type-checking only (`tsc --noEmit`). Same version as the frontend (Angular 22). TypeScript 7 exists (July 2026), revisit later. |
| `@types/node` | 24.x | Must match the Node major version (latest `@types/node` targets Node 26). |

Rules that come with Node's type stripping:
- Relative imports need the `.ts` extension: `import { app } from './app.ts'`.
- Type-only imports use `import type { ... }`.
- No `enum`, no namespaces with code, no constructor parameter properties, no decorators.

### Steps

```bash
mkdir backend
cd backend
npm init -y                     # creates package.json with default values
npm pkg set type=module         # use ES modules (import/export); npm 11 defaults to "commonjs"
npm install express             # runtime dependency
npm install --save-dev "typescript@~6.0.3" "@types/node@24" @types/express   # dev-only tools
```

- `dependencies` = needed when the server runs (also on Cloud Run).
- `devDependencies` = only needed while developing (type-checking); can be skipped in the production Docker image.
- `~6.0.3` = patch updates only; `^5.3.0` = minor updates allowed, never the next major.

`backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "rootDir": "./src",
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

| Option | Meaning |
|---|---|
| `target: esnext` | Latest JavaScript; Node 24 understands it, nothing to down-level. |
| `module: nodenext` | Same import rules as Node (respects `"type": "module"`, requires file extensions). |
| `strict` | Strict checks (e.g. possibly-`undefined` values) — catches bugs before running. |
| `noEmit` | `tsc` only checks; no `.js` output (Node runs the `.ts` files). |
| `allowImportingTsExtensions` | Allows `./app.ts` in imports (only valid with `noEmit`). |
| `erasableSyntaxOnly` | Errors on syntax Node can't just erase (`enum`, etc.). |
| `verbatimModuleSyntax` | Forces `import type` for type-only imports, matching Node's behaviour. |
| `rootDir` | Source lives in `src/`. Must be explicit in TypeScript 6. |
| `types: ["node"]` | Include Node's types (`process`, ...). Not automatic anymore in TypeScript 6. |
| `skipLibCheck` | Don't type-check `.d.ts` files inside `node_modules`. |

What `npm` created:

| File/folder | Created by | What it is | Commit? |
|---|---|---|---|
| `package.json` | `npm init` | The "recipe": which packages, which version ranges | yes |
| `package-lock.json` | `npm install` | The **exact** versions installed (incl. dependencies of dependencies), so every machine gets the same | yes |
| `node_modules/` | `npm install` | The downloaded packages; recreated any time from the two files above | no (`.gitignore`) |

### First server: `GET /health`

Two files in `backend/src/`, split so tests can later import `app` without starting a real server:

`backend/src/app.ts` — defines the application (routes):

```ts
// Builds the Express application (its routes), without starting the server
import express from 'express';

// The application object: we attach routes to it
export const app = express();

// Health check: a simple route that shows the server is alive
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
```

`backend/src/server.ts` — starts it on a port:

```ts
// Entry point: starts the HTTP server
import { app } from './app.ts';

// Cloud Run gives us the port in the PORT environment variable; locally we use 8080
const port = Number(process.env.PORT ?? 8080);

// Start listening for HTTP requests on that port
app.listen(port, (error) => {
  if (error) throw error; // e.g. the port is already in use
  console.log(`QueueUp backend listening on http://localhost:${port}`);
});
```

Key points:
- `import express from 'express'` = the package's *default* export (no braces); `import { app } from './app.ts'` = a *named* export (braces) and the `.ts` extension Node requires.
- `process.env.PORT` = environment variable; Cloud Run sets it and expects the server to listen there. `?? 8080` = fallback when it's not set. `Number(...)` because env variables are always strings.
- Express 5 passes startup errors to the `listen` callback — e.g. `EADDRINUSE` when the port is already used by another running instance.

Run it (from `backend/`):

```bash
node src/server.ts
```

Open <http://localhost:8080/health> → `{"status":"ok"}`. Stop with `Ctrl+C`; it does **not** restart on file changes (yet).

Gotcha: <http://localhost:8080/> shows **"Cannot GET /"** — that's Express's automatic 404 for a route we didn't define, which actually proves the server is running.

### npm scripts and a cleaned-up `package.json`

`backend/package.json` (the version ranges come from the `npm install` commands above):

```json
{
  "name": "queueup-backend",
  "version": "0.1.0",
  "description": "QueueUp backend: Express API for the clinic virtual queue",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "node --watch src/server.ts",
    "start": "node src/server.ts",
    "typecheck": "tsc"
  },
  "dependencies": {
    "express": "^5.3.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^24.19.2",
    "typescript": "~6.0.3"
  }
}
```

- `"private": true` — npm refuses to publish it to npmjs.com by accident.
- `"version": "0.1.0"` — `0.x` = still in development.
- Removed `main`, `keywords`, `author`, `license` and the placeholder `test` script (only useful for published packages).
- `"engines"` documents that Node ≥ 24 is required (native `.ts` support); npm warns on older versions.

| Script | Command | Use |
|---|---|---|
| `npm run dev` | `node --watch src/server.ts` | While coding — restarts automatically on every file save (like `ng serve`). |
| `npm start` | `node src/server.ts` | Normal start; this is how it will run on Cloud Run. |
| `npm run typecheck` | `tsc` | Type-checks all of `src/`; prints nothing when there are no errors. |

The same script names will be reused in Docker and GitHub Actions.

Next: shared formatting settings (`.editorconfig` + Prettier) for the whole repo — right now they only exist in `frontend/`, so VS Code uses 4-space indentation in `backend/`.

---

## 9. Reuse checklist for a new project

- [ ] Node LTS, Git (user + email), VS Code with Git Bash
- [ ] `npm install -g @angular/cli@<version>` → `ng version`
- [ ] Before adding any Angular library: check its `peerDependencies` against your Angular version (`npm view <pkg> peerDependencies`)
- [ ] `ng new <name> --style=css --ssr=false`, `ng add @angular/material`
- [ ] Root `.gitignore` covering `node_modules/`, `.env*`, service-account JSON, `*.tfstate`
- [ ] gcloud installer → restart VS Code → `gcloud init` → `gcloud config list`
- [ ] Firebase: register web app → `npm install firebase` → config file → `FirebaseService`
- [ ] Firestore: Standard, `(default)`, pick the region carefully (permanent; match your Cloud Run region), **production mode**
- [ ] Backend: `npm init -y` → `npm pkg set type=module` → Express + TypeScript (type-check only) → `tsconfig.json` from §8
- [ ] Work on feature branches, merge through PRs with squash
