# Document Tracker (v1)

Simple web app for offices to track physical and digital documents: who has them, status, and due dates.

## What you need

- Node.js (v18 or newer) — [nodejs.org](https://nodejs.org)
- A Supabase account — [supabase.com](https://supabase.com) (free tier is enough)

---

## Step 1: Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Pick an organization (or create one), choose a **name** (e.g. `document-tracker`) and a **database password** (save it somewhere safe).
4. Choose a region close to you and click **Create new project**. Wait until the project is ready.

---

## Step 2: Run the database schema

1. In your Supabase project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/schema.sql` in this repo, copy **all** its contents, and paste into the SQL Editor.
4. Click **Run** (or press Ctrl+Enter). You should see “Success. No rows returned.”

---

## Step 3: Get your Supabase keys

1. In Supabase, go to **Project Settings** (gear icon) → **API**.
2. You’ll see:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret; only for the seed script and backend)

---

## Step 4: Configure the app

1. In the project folder, copy the example env file:
   - **Windows (PowerShell):** `Copy-Item .env.example .env`
   - **Mac/Linux:** `cp .env.example .env`
2. Open `.env` and set:
   - `VITE_SUPABASE_URL` = your **Project URL**
   - `VITE_SUPABASE_ANON_KEY` = your **anon public** key
   - `SUPABASE_SERVICE_ROLE_KEY` = your **service_role** key (only for seeding)

---

## Step 5: Install dependencies and run the app

In the project folder, in a terminal:

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). You should see “Document Tracker — setup OK”.

---

## Step 6: Seed users (1 Admin + 2 Staff)

With the app configured and Supabase schema already run:

```bash
npm run seed
```

This creates:

| Email                 | Password        | Role   |
|-----------------------|-----------------|--------|
| admin@office.local   | AdminChangeMe1  | Admin  |
| staff1@office.local  | StaffChangeMe1  | Staff  |
| staff2@office.local  | StaffChangeMe1  | Staff  |

**Change these passwords after first login** (we’ll add a proper “change password” flow later).

---

## Next steps

After this setup we will add:

- Login page (using Supabase Auth)
- Dashboard with overdue count
- Documents list and filters
- Add/Edit document forms
- Document detail view

If anything in this setup fails (e.g. SQL error, seed error), tell me the exact message and we’ll fix it step by step.
