# Document Tracker — Full Project Context (v1.0 — March 2026)

## 1. Project Overview
Document Tracker is a web-based internal office application built for an audit department to track both physical and digital documents throughout their lifecycle.

Core capabilities:
- Register new documents (Third Party and Claims types)
- Track document status (Pending, In Progress, Sent)
- Monitor due dates and overdue states
- Log activity history with edit reasons (auditable actions)
- Restrict access via authentication and role-based permissions
- Export monthly reports to Excel
- Admin-controlled export permissions with audit trail
- In-app notifications for overdue and due soon documents
- Session timeout after 1 hour of inactivity
- Print view for document list

## 2. Technology Stack

### Frontend
- React (Vite)
- React Router (protected routes)
- Plain CSS (no UI frameworks)
- xlsx (SheetJS) for Excel export

### Backend
- Supabase
  - PostgreSQL database
  - Supabase Auth (email/password)
  - Row Level Security (RLS) enabled

### Tooling
- Node.js
- Git (local version control)
- GitHub: https://github.com/favouranyaogu/document-tracker
- Codex CLI (AI-assisted development)

## 3. Source of Truth
```
C:\Users\User\Documents\document-tracker
```
All tools must run from this directory. Do NOT mix with WSL or other paths.

## 4. Database Schema

### `profiles` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, links to auth.users |
| email | text | |
| name | text | |
| role | text | 'admin' or 'staff' |

### `documents` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| reference | text | PV Number |
| beneficiary | text | Primary identifier |
| description | text | Required |
| status | text | pending, in_progress, completed |
| assigned_to | uuid | Unused for now |
| due_date | date | Auto-set to 2 days from creation |
| created_at | timestamptz | |
| created_by | uuid | FK to auth.users |
| status_updated_at | timestamptz | |
| amount | numeric(12,2) | Required |
| document_type | text | 'third_party' or 'claims' |
| batch_number | text | Required. Auto-detects type: TPP/NCDF = third_party, SP = claims |
| date_out | timestamptz | Auto-set when status → completed, cleared otherwise |

### `activity_logs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| document_id | uuid | FK to documents |
| action | text | 'created', 'edited', 'status_changed' |
| old_value | text | Previous status value |
| new_value | text | New status value OR edit reason |
| user_id | uuid | FK to auth.users |
| created_at | timestamptz | |

### `export_permissions` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth.users |
| granted_by | uuid | FK to auth.users |
| granted_at | timestamptz | |
| is_active | boolean | |

### `export_logs` table
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| exported_by | uuid | FK to auth.users |
| exported_at | timestamptz | |
| month_year | text | e.g. '2/2026' |
| record_count | integer | |

## 5. RLS Policies (Clean - 6 total)

### documents
- All users can view documents (SELECT)
- Authenticated users can insert documents (INSERT)
- Admin or owner can update documents (UPDATE)
- Only admin can delete documents (DELETE)

### activity_logs
- All users can view logs (SELECT)
- Authenticated users can insert logs (INSERT)

## 6. Users (Seeded)
| Email | Name | Role |
|-------|------|------|
| admin@office.local | Office Admin | admin |
| staff1@office.local | Staff One | staff |
| staff2@office.local | Staff Two | staff |

## 7. Component Structure
```
src/
  components/
    Navbar.jsx
    KPIBar.jsx
    DocumentCard.jsx
    DocumentForm.jsx
    modals/
      DeleteModal.jsx
      EditReasonModal.jsx
      PasswordModal.jsx
      InactivityModal.jsx
  App.jsx  (routing, state, handlers)
  index.css
```

## 8. What Has Been Built

### Authentication
- Email/password login
- Protected routes
- Logout functionality
- Session persistence
- Fast auth load (profile fetched in background)
- Password change from navbar account menu
- Session timeout after 58 minutes of inactivity with 2 minute warning modal

### Document Management
- Create documents: Beneficiary, Reference/PV No, Batch Number, Description, Amount, Status
- Document type auto-detected from batch number prefix (TPP/NCDF = Third Party, SP = Claims, unknown = manual select)
- Due date auto-set to 2 days from creation
- Date Out auto-set when status → Sent, cleared otherwise
- Edit documents inline with required reason before editing
- Delete documents (admin only) with confirmation modal
- Status change inline via dropdown on card
- Edit limit: staff max 3 edits per document, admin unlimited
- "Edited" badge on modified cards
- "Sent on: [date]" shown instead of due date on completed documents

### Document Types
- Two types: Third Party and Claims
- Tab switcher for filtering by type
- Type auto-detected from batch number prefix

### Activity Logging
- Creation, status changes, and edits logged
- Edit reason required and stored in activity log
- Human-readable formatting in history view
- User names shown (not UIDs)

### Role-Based Permissions
- Admin: edit/delete any document, unlimited edits, always has export access
- Staff: only edit own documents, cannot delete, 3 edit limit
- Buttons visible to all, actions blocked with inline message for unauthorized users
- Role badge in navbar

### KPI Bar
- Total Documents, Total Amount, Overdue, Due Soon, Total Sent

### Filtering & Search
- Tab switcher: Third Party / Claims
- Filter by status
- Search by beneficiary, description, reference, batch number
- Date range filter (From / To) by created_at

### Excel Export
- Admin always has access, staff need permission granted by admin
- Single sheet "Monthly Report"
- Columns: Entry Date | Beneficiary | Description | PV No | Batch No | Amount | Date Out | Status
- Totals at bottom: TOTAL DOCUMENTS, TOTAL AMOUNT
- Filename reflects active tab: `third-party-report-YYYY-MM.xlsx` or `claims-report-YYYY-MM.xlsx`
- Export respects active tab — no mixing of Third Party and Claims
- Export logged to export_logs

### Export Permissions (Admin UI)
- Grant/Revoke export access per staff user
- Export history: who exported, when, which month, record count

### Notifications
- Bell icon in navbar with red badge count
- Dropdown shows overdue and due soon documents
- Overdue sorted first, due soon second
- Derived from existing documents state — no extra Supabase queries

### UI
- Modern SaaS design, calm color palette
- Card-based layout with left border accent by status
- Neutral card action buttons, color only on hover
- Delete confirmation modal
- Edit reason modal
- Inactivity warning modal
- Password change modal
- Print view via `@media print` — clean table, no UI chrome
- ₦ currency symbol on amounts

## 9. Pending Work (Post Client Feedback)
1. **Utils/hooks refactor** — move utility functions to `src/utils.js` and custom hooks
2. **Print view improvement** — dynamic title based on active tab
3. **Hosting** — deploy to Vercel when client approves (free tier, connects to GitHub)

## 10. What NOT to Build Yet
- Queries and Returns — do not build until client accepts and explicitly requests it
- JCC document type — never confirmed, do not suggest
- Network/IP restriction — only if client explicitly requests it
- Account self-registration — keep manual via Supabase
- Auto PV number generation — department generates externally
- Document assignment — assigned_to column exists but unused, pending client feedback

## 11. Security Notes
- Supabase anon key visible in frontend — safe because RLS is properly enforced
- RLS enforced at database level on all tables
- Role-based permissions on both frontend and database
- Session timeout after 1 hour of inactivity
- No rate limiting on login beyond Supabase defaults
- HTTPS only relevant in production — use Vercel which handles this automatically

## 12. Development Workflow Rules
1. Always verify working directory: `C:\Users\User\Documents\document-tracker`
2. Always run dev server from source-of-truth folder
3. Commit before major refactors
4. Use Git restore to undo bad edits
5. Never rely on sandbox state
6. Codex for code changes, PowerShell for git commits
7. `git push` to sync to GitHub after committing

## 13. Architectural Decisions
- Plain CSS only (no Tailwind, no UI libraries)
- Native `<select>` elements only — no custom dropdowns
- activityLogs stored as keyed object `{ [documentId]: logs[] }`
- Document type auto-detected from batch number
- Edit count derived from activity_logs, no separate column
- Notifications derived from existing documents state, no extra queries
- Components extracted: Navbar, KPIBar, DocumentForm, DocumentCard, all modals
- App.jsx handles routing, state, and handlers only
