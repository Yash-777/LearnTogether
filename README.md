# LearnTogether

A collaborative developer dashboard: light Claude.ai-style shell (collapsible
sidebar with search, "Languages" groups, recent list), colorful launch page,
syntax-highlighted static content, role-based wiki-style page authoring, and
Firebase-backed accounts.

## Libraries used (and why)

Per the project's guiding principle - use a mature open-source library
instead of writing more custom code - here's every dependency added in this
version and the reasoning:

| Library | Used for | Why this one |
|---|---|---|
| `firebase` | Client-side Auth + Firestore | Official Google SDK; the standard choice for this exact stack (email/password auth, a live-updating document database) |
| `firebase-admin` | Server-side token verification + Firestore access | Official Google SDK for trusted server code - verifies ID tokens cryptographically, can't be spoofed by the browser |
| `react-syntax-highlighter` | Colorized code blocks (`CodeBlock.jsx`) | Wraps Prism/highlight.js - mature, handles dozens of languages correctly; writing a tokenizer/colorizer by hand would be a lot of fragile code for something users can't tell apart from the library version |
| `lucide-react` | Icons (eye/eye-off, sun/moon, logout, password generator wand, checklist marks) | Popular open-source (ISC license) icon set, tree-shakeable, no custom SVG drawing needed |
| `express-rate-limit` | API request throttling | Handles sliding-window counting and cleanup correctly - easy to get subtly wrong by hand |
| Web Crypto API (`crypto.getRandomValues`) | Secure random password generation | Not a library - a browser standard. Deliberately NOT `Math.random()`, which isn't cryptographically secure and is unsuitable for anything security-related |

The only genuinely custom logic is `src/utils/passwordStrength.js`'s 4-rule
scorer - a library like `zxcvbn` scores by guessability/dictionary attack
resistance, which doesn't map onto this project's exact stated rules (7+
chars, upper, lower, special character), and would add real dependency
weight for something 4 `if` checks handle correctly. That reasoning is also
documented inline in the file itself.

## Setting up Firebase (required for sign-up/sign-in to work)

Auth and Firestore need a real backend project - there's no way around
creating your own free Firebase project:

1. Go to https://console.firebase.google.com, create a project.
2. **Enable Auth**: Build → Authentication → Sign-in method → enable
   "Email/Password".
3. **Enable Firestore**: Build → Firestore Database → Create database (start
   in test mode for local development - see the security note below).
4. **Get your web app config**: Project settings → General → "Your apps" →
   add a Web app → copy the config values into a `.env` file:
   ```bash
   # Copy the example file
   copy .env.example .env
   ```
   Then fill in the `VITE_FIREBASE_*` variables with your values:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
   ```
   
5. **Get a service account key** (for the server, not the browser): Project
   settings → Service accounts → "Generate new private key" → save the
   downloaded JSON file. Place it at:
   ```
   c:\Yashwanth\WorkSetup\NodeJS\serviceAccountKey.json
   ```
   (or update `GOOGLE_APPLICATION_CREDENTIALS` path in `.env` if you prefer a different location)

6. **Promote yourself to admin**: sign up through the app once (you'll start
   as "viewer"), then in the Firebase console open Firestore → `users`
   collection → your document → change `role` to `"admin"` manually. From
   then on, use `/admin/users` in the app to promote anyone else.

**Security note**: Firestore's "test mode" allows any signed-in (or even
anonymous) client to read/write any document - fine for local development,
not for production. Before deploying for real, write Firestore Security
Rules restricting `users/{uid}` writes to admins only (a user should never
be able to grant themselves a role by editing their own document directly).

## Setting up default test users

To quickly get started with multiple test accounts, run the default user setup script:

```bash
npm run setup-users
```

This creates four test accounts with different roles:

| Username | Email | Password | Role |
|---|---|---|---|
| `Yash-777` | yash.777@learntogether.dev | *randomly generated* | admin |
| `Yash-Admin` | yash.admin@learntogether.dev | `Admin` | admin |
| `Yash-Editor` | yash.editor@learntogether.dev | `Editor` | editor |
| `Yash-Viewer` | yash.viewer@learntogether.dev | `Viewer` | viewer |

The script will display the randomly-generated password for `Yash-777` at the end - save it securely. If any user already exists (from a previous setup run), it will be skipped.

**⚠️ For production**: Replace these hardcoded passwords with a proper secrets management system (e.g., environment variables, AWS Secrets Manager, HashiCorp Vault) before deploying live.

## Run it locally (two terminals)

**Terminal 1 - the React app:**
```bash
npm install
npm run dev
```

**Terminal 2 - the local API server** (drafts, publishing, auth checks, rate limiting):
```bash
npm run server
```

If `npm install` reports an esbuild vulnerability or an `EBUSY` file-lock
error, see the "Troubleshooting" section at the bottom.

## Roles

| Role | Can view | Can create drafts | Can publish | Can manage users |
|---|---|---|---|---|
| *(not signed in)* | Public topics only | ✗ | ✗ | ✗ |
| viewer | All topics (public + restricted) | ✗ | ✗ | ✗ |
| editor | All topics | ✓ (goes to review) | ✗ | ✗ |
| admin | All topics | ✓ | ✓ | ✓ |

New accounts always start as **viewer** - there's no self-service way to
become an editor/admin (an existing admin promotes you via `/admin/users`).
A topic can be marked `restricted: true` in its data file to require any
login at all (see `src/data/topics/json.js`'s "schema-validation" topic for
an example) - otherwise topics are public.

Enforcement happens in **two places** on purpose:
- `src/components/RequireRole.jsx` - hides UI you can't use (good UX, not security)
- `server/auth.js` + `server/index.js` - verifies your Firebase ID token and
  checks your real Firestore role before allowing a draft/publish request to
  go through, even if someone calls the API directly, bypassing the UI
  entirely. Never trust a frontend-only check for anything that actually
  needs to be secure.

## Session limit (2 devices per account)

Each browser gets a random device ID stored in `localStorage`
(`src/utils/deviceId.js`). On sign-in, `AuthContext.jsx` checks how many
distinct devices are already registered in your Firestore user doc; a 3rd
device is blocked with a friendly message asking you to sign out elsewhere
first (or an admin/you can call `signOutOtherDevices()` to reclaim a slot).

**Honesty note**: this is a demo-level cap enforced by client code reading/
writing Firestore directly - clearing `localStorage` effectively creates a
"new device" as far as this code can tell. A tamper-proof version would need
server-issued session tokens validated on every request (e.g. via a Cloud
Function), which is a larger undertaking than this project currently
includes.

## Rate limiting

Separately from the session cap above, `server/rateLimit.js` uses
`express-rate-limit` to cap requests per IP address (100 requests / 15
minutes) across all `/api/*` routes. Going over it returns a friendly
message instead of a raw error:

> "We're limiting requests right now to keep LearnTogether fast and fair for
> everyone. Please try again in a few minutes."

## Themes

Light, Dark, and "Match system" (follows your OS's dark-mode setting live).
Switch via the sun/moon/monitor icon in the header (click to cycle) or the
dropdown on `/preferences`. Implemented with CSS custom properties (see the
`[data-theme='dark']` block in `src/index.css`) - every component already
uses `var(--color-bg)` etc., so no per-component dark-mode code was needed.

## Password rules (sign-up)

At least 7 characters, one capital letter, one lowercase letter, one special
character - each met rule fills one of 5 colored strength-meter segments
(red → orange → yellow → blue → green). The wand icon generates a
cryptographically random password meeting all 4 rules instantly (see
"Libraries used" above for why it's the Web Crypto API, not a library or
`Math.random()`).

## Folder structure

```
server/                    # local-only Express server
  index.js                  # routes: rate limit -> auth -> role check -> action
  auth.js                    # Firebase ID token verification + role lookup
  firebaseAdmin.js            # firebase-admin SDK init
  rateLimit.js                 # express-rate-limit config
  fileOps.js                    # draft temp-folder + real file editing
  drafts/                        # <-- the "temp folder"

src/
  firebase/config.js         # client Firebase SDK init
  context/
    AuthContext.jsx           # useAuth() - user, role, signUp/signIn/signOut, device cap
    ThemeContext.jsx           # useTheme() - light/dark/system
  components/
    RequireRole.jsx            # route guard (UI-level)
    PasswordField.jsx           # strength meter + generator + show/hide
    CodeBlock.jsx                 # syntax-highlighted code rendering
  utils/
    passwordStrength.js          # 4-rule scorer + secure generator
    deviceId.js                    # persistent per-browser ID
    topicCodegen.js                 # shared code-gen (used by UI AND server)
    recentTopics.js                  # localStorage "recently viewed"
  data/topics/                # <-- content data (color, codeLang, tools per category)
  pages/
    Dashboard.jsx               # launch page
    Preferences.jsx              # theme + local prefs
    auth/SignUpPage.jsx / SignInPage.jsx
    content/CategoryPage.jsx / TopicPage.jsx
    admin/NewTopicPage.jsx / DraftsPage.jsx / UsersPage.jsx
  layout/Header.jsx / Sidebar.jsx / AppLayout.jsx
```

## The wiki-style page workflow

1. Sign in as admin or editor → **"+ New topic"** → fill the form → live preview.
2. **Save as draft** → server verifies your token/role → writes JSON into
   `server/drafts/` (the temp folder). Nothing in real source code changes yet.
3. Go to **/drafts** to review. Editors see only their own submissions;
   admins see everyone's.
4. **Publish** (admin only) → server edits the real `src/data/topics/*.js`
   files (and `index.js` for a new category) → Vite hot-reloads the running
   app automatically.
5. No server running, or want to review code by eye first? **"Generate code
   instead"** produces copy-paste-ready code, no backend required.

## What's intentionally not built yet

- Actual formatter/validator tool pages (JSON formatter, JWT encode/decode) -
  referenced by slug in each category's `tools` list. Most can run entirely
  client-side with no backend at all.
- Firestore Security Rules for production (see the security note above).
- Email verification, password reset, and OAuth providers (Google/GitHub
  sign-in) - Firebase Auth supports all of these; only email/password is
  wired up here.
- The production Node BFF / Spring Boot API from the original architecture
  doc - `server/` here is a local dev convenience, not meant to be deployed.

## Troubleshooting

**`EBUSY: resource busy or locked, unlink ... esbuild.exe`** - something
(a running `npm run dev`, or antivirus) had that file open mid-install.
Stop `npm run dev`, then:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

**`esbuild <=0.24.2` moderate vulnerability (GHSA-67mh-4wv8-2f99)** - fixed
upstream in esbuild 0.25.0; this project's `package.json` pins it directly
via `"overrides": { "esbuild": "^0.25.0" }` so `npm install` gets the patched
version regardless of what Vite requests transitively.
