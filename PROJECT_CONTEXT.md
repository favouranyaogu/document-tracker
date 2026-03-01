# Document Tracker — Full Project Context (Updated Feb 2026)

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
- GitHub (remote backup)
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
| beneficiary | text | Primary identifier (replaces title) |
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

## 7. What Has Been Built

### Authentication
- Email/password login
- Protected routes
- Logout functionality
- Session persistence
- Fast auth load (profile fetched in background, doesn't block render)
- Password change from within app (navbar account menu)

### Document Management
- Create documents with: Beneficiary, Reference/PV No, Batch Number, Description, Amount, Status
- Document type auto-detected from batch number prefix (TPP/NCDF = Third Party, SP = Claims, unknown = manual select)
- Due date auto-set to 2 days from creation
- Date Out auto-set when status changes to Sent/Completed, cleared otherwise
- Edit documents inline (within card) — requires reason before editing
- Delete documents (admin only) with confirmation modal
- Status change inline via dropdown on card
- Edit limit: staff can edit max 3 times per document, admin unlimited
- "Edited" badge on cards that have been modified

### Document Types
- Two types: Third Party and Claims
- Tab switcher in documents panel for filtering by type
- Type auto-detected from batch number

### Activity Logging
- Document creation logged
- Status changes logged (with old and new values)
- Edits logged with reason provided by user
- History displayed per document with human-readable formatting:
  - "You created this document"
  - "Office Admin changed status from Pending → In Progress"
  - "You edited this document - Reason: [reason]"
- Activity log users shown by name (not UID)

### Role-Based Permissions
- Admin: can edit/delete any document, unlimited edits, always has export access
- Staff: can only edit documents they created, cannot delete, edit limit of 3
- Buttons visible to all but actions blocked with inline message for unauthorized users
- Role badge shown in navbar

### KPI Bar
- Total Documents
- Total Amount (sum of all document amounts, formatted)
- Overdue count
- Due Soon count (within 2 days)
- Total Sent count

### Filtering & Search
- Tab switcher: Third Party / Claims
- Filter by status (All, Overdue, Pending, In Progress, Sent)
- Search by beneficiary, description, reference, batch number

### Excel Export
- Admin always has access
- Staff need admin to grant export permission
- Export picker: select month and year
- Generates single sheet "Monthly Report"
- Columns: Entry Date | Beneficiary | Description | PV No | Batch No | Amount | Date Out | Status
- Totals at bottom: TOTAL DOCUMENTS, TOTAL AMOUNT
- Filename: `third-party-report-YYYY-MM.xlsx` or `claims-report-YYYY-MM.xlsx`
- Export logged to export_logs table

### Export Permissions (Admin UI)
- Admin sees list of staff with Grant/Revoke access buttons
- Export history panel showing who exported, when, which month, record count

### UI
- Modern SaaS design
- Card-based document layout with left border accent by status color
- Navbar with account menu (Change Password, Logout)
- Delete confirmation modal
- Edit reason modal
- Role badge in navbar
- KPI summary bar
- Muted, calm color palette — no color overload
- ₦ currency symbol on amounts

## 8. Known Issues / In Progress
- **Document grid CSS bug**: On desktop two-column grid, when one card expands its history the adjacent card on the same row stretches to match height. Logic is confirmed correct (unique IDs, keyed activityLogs state). Bug is CSS only — `align-items: start` and `align-self: start` on `.document-card` not resolving it yet. Needs fresh investigation.
- Console shows encoding issue with arrow character in status_changed logs: `â†'` instead of `→` — needs charset fix
- Debug console.log still in toggleHistory function — needs removal

## 9. Pending Work (Priority Order)
1. **Fix document grid CSS stretch bug** (known issue above)
2. **Remove debug console.log from toggleHistory**
3. **Fix arrow encoding bug** in formatActivityLog (→ showing as â†')
4. **Session timeout** after 1 hour of inactivity
5. **In-app notifications** (bell icon, overdue alerts)
6. **Component refactor** — App.jsx is very large (~1600 lines), needs splitting into components
7. **Queries and Returns** — DO NOT BUILD until client accepts and approves the app first
8. **Print view** — clean printable version of monthly document list

## 10. Architectural Decisions
- Single App.jsx (refactor pending — too large now)
- Plain CSS only (no Tailwind, no UI frameworks)
- Supabase for auth + database
- No custom dropdown logic — native `<select>` elements only
- activityLogs stored as keyed object `{ [documentId]: logs[] }` not flat array
- Document type auto-detected from batch number, not manually selected
- Edit count derived from activity_logs query, no separate column

## 11. Development Workflow Rules
1. Always verify working directory: `C:\Users\User\Documents\document-tracker`
2. Always run dev server from source-of-truth folder
3. Commit before major refactors
4. Use Git restore to undo bad edits
5. Never rely on sandbox state
6. Codex for code changes, PowerShell for git commits
7. Always read SKILL.md files before creating documents

## 12. Long-Term Vision
- Structured internal document control system
- Role-based access (done)
- Dashboard analytics
- Clear document lifecycle tracking
- Queries and Returns section (only after client approves and requests it)
- Production-ready architecture
- Component-based structure (pending refactor)

## 13. What NOT to Build Yet
- JCC document type — never discussed in detail, do not bring up or suggest. Only mention if client explicitly asks for it.
- Queries and Returns — do not build until client accepts the app and explicitly requests it
- Account self-registration flow (keep manual via Supabase for now)
- Network/IP restriction — only build if client explicitly requests it, not a current requirement
- Auto PV number generation (department generates these externally)
- Document assignment (assigned_to column exists but unused — pending client feedback)
