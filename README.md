# My Day — Personal Daily Task Planner

A modern, calm, and private daily task planner built with **React**, **TypeScript**, **Supabase**, **Vite**, **Tailwind CSS**, **PWA**, and **Capacitor** for Web, Desktop, and Android.

Inspired by the clarity, tactile simplicity, and aesthetic polish of *Things 3*, *Linear*, and *Todoist*, **My Day** is tailored strictly for personal productivity—free from SaaS clutter, subscription nags, fake analytics, or team overhead.

---

## Features

- **Dynamic Daily Dashboard**:
  - Time-aware greetings (*Good morning*, *Good afternoon*, *Good evening*) aligned to your local timezone (defaults to `Asia/Amman`).
  - Live progress summary: dynamic completion percentage, remaining task counts, and a celebration effect upon finishing all tasks for the day.
  - Quick-add input: Type your task title and hit <kbd>Enter</kbd> to add it to Today instantly.
- **Top 3 Daily Priorities**: Prominent focus cards keeping your most critical objectives front and center.
- **Interactive Task List & Views**:
  - Task grouping into **Overdue**, **Today**, **Upcoming & Later**, and collapsible **Completed**.
  - Multi-view selector: **Standard List**, **Compact List**, and **Kanban Board** (persisted in your cloud preferences).
  - Priority levels: *High*, *Medium*, and *Low* with subtle semantic badges.
  - Subtask checklists with progress indicators (`1/3` completed).
  - Recurrence rules: *Daily*, *Weekdays*, *Weekly*, *Monthly*, or *Custom intervals*.
  - Task duplication, date re-scheduling, and deletion with instant **Undo toast**.
- **Focus Mode**:
  - Distraction-free single task immersion mode with a minimalist 25-minute Pomodoro timer.
- **Interactive Calendar**:
  - Month, Week, and Agenda views with click-to-create date binding and category color tags.
- **Custom Categories**:
  - Default categories (*Work*, *Personal*, *Urgent*) initialized idempotently.
  - Custom category creator with color palette and 20+ Lucide icons.
  - Safe category deletion modal with mandatory task reassignment or unlinking to prevent silent task loss.
- **Themes & Aesthetics**:
  - Warm off-white canvas in Light mode (`#FAFAF8`).
  - Deep refined charcoal surfaces in Dark mode (`#121316` / `#1A1C22`).
  - Customizable accent colors: *Indigo*, *Violet*, *Deep Blue*, *Emerald*, *Rose*, and *Amber*.
- **Full Keyboard Navigation**:
  - <kbd>N</kbd> — Create new task
  - <kbd>/</kbd> — Focus search & filters
  - <kbd>T</kbd> — Jump to Today
  - <kbd>C</kbd> — Open Calendar
  - <kbd>Ctrl</kbd> + <kbd>Enter</kbd> — Save task
  - <kbd>Esc</kbd> — Dismiss modals and slide-overs
- **Offline & Real-Time Sync**:
  - Backed by Supabase PostgreSQL with Row Level Security (RLS) policies.
  - Realtime publication on `tasks`, `categories`, and `subtasks` for instant cross-tab / cross-device synchronization.
  - Offline fallback with local draft caching and offline connection status banner.
  - Data portability: JSON Export, JSON Import, and safe clear database actions.
- **PWA & Native Android Packaging**:
  - Installable Progressive Web App with service worker offline caching and Web App Manifest.
  - Pre-configured Capacitor Android native project with adaptive launcher icons, safe-area insets, and hardware back-button handling.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Core** | React 19, TypeScript, Vite 8 |
| **Styling** | Vanilla Tailwind CSS (v3), PostCSS, CSS Variables |
| **Icons** | Lucide React |
| **Backend & Auth** | Supabase PostgreSQL, Supabase Auth, Supabase Realtime |
| **Server State** | TanStack React Query v5 (optimistic updates, cache invalidation) |
| **Forms & Validation** | React Hook Form, Zod v4 |
| **Date Handling** | date-fns v4 (Timezone-safe YYYY-MM-DD parsing, Asia/Amman defaults) |
| **Animations** | Framer Motion & Canvas Confetti |
| **Mobile & Native** | Vite PWA Plugin, Capacitor v8 (Android) |

---

## Project Structure

```
my-day-task-planner/
├── android/                         # Capacitor Android native project
│   ├── app/src/main/AndroidManifest.xml
│   └── app/src/main/res/values/strings.xml
├── public/                          # Static assets, PWA icons, manifest
│   ├── favicon.svg
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── scripts/                         # Utility scripts (icon generation)
├── src/
│   ├── components/
│   │   ├── auth/                    # Sign in, Sign up, Forgot password
│   │   ├── calendar/                # Month, Week, Agenda views
│   │   ├── category/                # Category chips & Safe Delete manager
│   │   ├── common/                  # Button, Input, Modal, Badge, Dropdown, Toast
│   │   ├── layout/                  # Sidebar, Header, BottomNav, AppLayout
│   │   ├── settings/                # SettingsView (theme, accents, export/import)
│   │   └── task/                    # TaskItem, TaskList, TaskBoard, QuickAdd, FocusMode
│   ├── hooks/                       # useAuth, useTasks, useCategories, useSettings, useRealtime
│   ├── integrations/supabase/       # Typed Supabase client & credentials helper
│   ├── lib/                         # Date utilities, queryClient, theme tokens
│   ├── pages/                       # TodayPage, CalendarPage, CategoriesPage, CompletedPage
│   ├── services/                    # Dedicated auth, profile, task, category, settings services
│   ├── types/                       # database.ts, task.ts
│   ├── App.tsx                      # Root application & routing
│   ├── index.css                    # Design system tokens & Tailwind imports
│   └── main.tsx
├── supabase/
│   └── migrations/                  # 20261003000000_init_my_day_schema.sql (RLS, Triggers)
├── test/                            # Automated verification tests
├── .env.example                     # Environment variables template
├── capacitor.config.ts              # Capacitor Android configuration
├── tailwind.config.js               # Theme colors, border radius, shadows
└── vite.config.ts                   # Vite + PWA service worker config
```

---

## Getting Started

### 1. Prerequisites

- **Node.js** v20+ or v22+
- **npm** v10+
- *(Optional for Android build)*: **Android Studio** (Hedgehog or newer) with Android SDK 34+

### 2. Installation

Clone or enter the project directory and install dependencies:

```bash
npm install
```

### 3. Environment Variables Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

> **Security Note**: Never commit `.env` or place the `service_role` secret key in client code. The frontend only requires the public Project URL and Anon/Publishable Key.

---

## Supabase Database Setup & Migrations

### 1. Create a Supabase Project

1. Sign in to [Supabase](https://supabase.com).
2. Click **New Project**, choose your preferred region, and set a database password.

### 2. Run Database Migrations

Open the **SQL Editor** in your Supabase Dashboard:

1. Click **New Query**.
2. Copy the entire contents of [`supabase/migrations/20261003000000_init_my_day_schema.sql`](file:///c:/MyProjects/Task%20Planner/supabase/migrations/20261003000000_init_my_day_schema.sql).
3. Paste into the SQL editor and click **Run**.

This script automatically sets up:
- `profiles`, `categories`, `tasks`, `subtasks`, and `user_settings` tables.
- Performance indexes on foreign keys, `due_date`, and `status`.
- Automatic `updated_at` triggers.
- Idempotent new user initialization trigger: Automatically creates user profiles, default user settings, and standard default categories (*Work*, *Personal*, *Urgent*) upon signup.
- Strict **Row Level Security (RLS)** policies ensuring users can only read, write, and modify their own records.
- Enables PostgreSQL Realtime on `tasks`, `categories`, and `subtasks`.

### 3. Authentication Configuration

In your Supabase Dashboard:
1. Navigate to **Authentication** → **Providers** → **Email**.
2. Ensure **Enable Email provider** is turned **ON**.
3. (Optional) Toggle **Confirm email** according to your preference (for personal development, you may disable email confirmation to test immediately).
4. Add your local URL (`http://localhost:54321`) to **URL Configuration** → **Redirect URLs**.

---

## Development & Production Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts local Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript and generates production bundle in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run lint` | Runs the linter on all source files |
| `npm test` | Runs the automated Node test suite |

---

## Progressive Web App (PWA)

**My Day** is configured with `vite-plugin-pwa` as a high-performance installable web application:
- **Offline Shell**: Pre-caches static assets and CSS, allowing the app to launch offline.
- **Installation**: When opened in Chrome, Edge, or mobile Safari/Chrome, click the **Install App** icon in the address bar or select *Add to Home Screen*.
- **Auto-Updates**: Automatically checks for service worker updates in the background.

---

## Capacitor Android Native Application

### 1. Build & Sync Web Assets to Android

Whenever you make frontend changes, build and sync:

```bash
npm run cap:build
```

*(This compiles the web app and copies `dist/` into `android/app/src/main/assets/public`)*

### 2. Open in Android Studio

```bash
npm run cap:open
```

Or open the `android/` directory directly in **Android Studio**.

### 3. Generate a Debug APK

1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
2. The generated APK will be in:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Alternatively, generate it from the command line:
   ```bash
   cd android && ./gradlew assembleDebug
   ```

### 4. Generate a Signed Release APK / AAB (Google Play)

1. In Android Studio, select **Build** → **Generate Signed Bundle / APK**.
2. Select **Android App Bundle** (for Google Play Store upload) or **APK** (for direct release install).
3. Create or select your keystore file (`.jks` / `.keystore`).
4. Select destination folder and build variant **release**.
5. The signed `.aab` file will be generated in `android/app/release/`.

---

## Security Best Practices

1. **Zero Secret Leaks**: The service-role key is never stored in git or bundled in client-side code.
2. **Row Level Security (RLS)**: Enforced directly at the database engine level via `auth.uid() = user_id`.
3. **No LocalStorage Task Primary Storage**: All task data is stored in PostgreSQL. LocalStorage is strictly used for pre-auth theme persistence and offline form draft resilience.
4. **Foreign Key Integrity**: Subtasks and tasks cascade properly, and categories cannot be deleted without explicitly handling associated tasks.

---

## Troubleshooting

- **Supabase credentials not connecting?**
  - Verify that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your Supabase dashboard.
  - You can also click **Connect Supabase Now** in the top alert bar to set them interactively at runtime.
- **Timezone conversion shifts dates?**
  - Tasks store calendar deadlines as Postgres `date` (`YYYY-MM-DD`). The custom `parseLocalDate` helper guarantees that midnight conversions across DST or UTC offsets never shift a task from one calendar day to another.
- **Port 54321 already in use?**
  - You can customize the port anytime via `PORT=your_port npm run dev` or change the `port` value in `vite.config.ts`.

---

## License

Private personal productivity application. Free for personal daily use.
