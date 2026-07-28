# Duty Management System

A modern web-based Duty Management System built for planning, assigning and managing operational duty rosters.

Designed for organizations that need a simple overview of personnel, teams, duty rules and schedules.

---

## Features

### Dashboard

- Operational overview
- Employee statistics
- Team overview
- Duty rule count
- Assignment statistics

![Dashboard](docs/images/dashboard.png)

---

### Monthly Schedule

- Monthly calendar view
- Weekday assignments
- Weekend duty visualization
- Click-to-assign, edit and delete duty assignments
- Fully persisted to the backend, with automatic refresh
- Navigation between months

![Schedule](docs/images/schedule.png)

---

### Employee Management

- Create employees
- Edit employees
- Delete employees
- Search employees
- Team assignment

![Employees](docs/images/employees.png)

---

### Roster Generation

- Automatically generates duty assignments for a chosen team and month, driven by that team's duty rules (`FIXED` and `ROTATION`)
- Preview shows each day's outcome before committing: already scheduled, will be created, unassigned (manual/no rule), holiday, or conflict
- Conflict detection flags two cases before anything is committed: an active rotation rule with no team members to rotate through, and an employee who's already booked on another team that same day (cross-team double-booking) — generation skips conflicted days rather than compounding them
- Manually assigning or editing duty on the Schedule page is blocked outright if it would double-book an employee against an existing assignment on any team
- Optional overwrite of existing assignments when a rule changes
- Idempotent — re-running never duplicates assignments

  ![Roster](docs/images/Roster.png)

---

### Holidays

- Company-wide or per-employee holidays, as single days or multi-day ranges
- Overlap detection prevents duplicate/conflicting entries per employee
- Roster generation automatically skips any day covered by a matching holiday, so affected days stay unassigned for manual handling

![Holidays](docs/images/Holidays.png)

---

### Teams

- Create, edit and delete teams (name, description, color)
- Color is used consistently across Employees, Schedule, Roster and Duty Rules
- Deletion is blocked with a clear message while a team still has employees, duty rules, or assignments linked to it

![Teams](docs/images/Teams.png)

---

### Duty Rules

- Per-team, per-weekday rules: `FIXED` (always the same employee), `ROTATION` (rotates weekly across the team), or `MANUAL` (assigned by hand)
- Filterable by team, with duplicate team/weekday rules rejected
- Directly drives Roster Generation

![Duty Rules](docs/images/Dutyrules.png)

---

### Light / Dark Mode

- Toggle in the top bar, with the choice persisted and the OS preference respected on first load
- Full theme system — all pages and layout chrome adapt, not just a background swap

![Lightmode](docs/images/Lightmode.png)
![Darkmode](docs/images/Darkmode.png)

---

### Reports

- Monthly, per-team report: days covered, who had duty when, and full duty pay breakdown
- Duty pay rates: **XXXX DKK** per weekday duty, **XXXX DKK** flat per weekend duty block (Fri–Sun covered by the same person, however many days), **XXXX DKK** for a duty on a company-wide holiday — weekend pay wins if a holiday falls on a weekend day
- Per-employee summary (days worked, total pay) alongside the full daily duty log
- Configurable pay-period start day per team (e.g. the 20th of one month through the 19th of the next), editable directly from the Reports page — defaults to a plain calendar month
- Export to Excel (.xlsx, multi-sheet) and PDF

---

### Access Control & Settings

- App-wide password lock — a single shared password required to open the app, toggled from Settings
- Settings itself sits behind a second, separate admin password, so unlocking the app doesn't grant access to Settings
- **Microsoft Entra ID (Azure AD) single sign-on** — ships built in but inactive; an admin registers an app in the Entra admin center and fills in the Tenant ID, Client ID, Client secret and Redirect URI from Settings to turn it on. Once enabled, "Sign in with Microsoft" appears alongside the local password on the login screen — the local password always keeps working as a fallback
- Client secret is encrypted at rest

---

## Planned Features

- Employee availability
- Email notifications
- Audit log
- Role based permissions

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Material UI
- React Router

### Backend

- NestJS
- Prisma ORM
- PostgreSQL

---

## Project Structure

```
DutyManagementSystem/
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   └── images/
│
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
npm install

# configure backend/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/duty"
# PORT=3001

npx prisma migrate deploy   # or `npx prisma migrate dev` in development
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install

# configure frontend/.env
# VITE_API_URL=/api   (or the backend's base URL)

npm run dev
```

### Microsoft Entra ID SSO (optional)

Ships disabled by default — the app works purely on the local password until you turn this on.

1. Register an app in the [Entra admin center](https://entra.microsoft.com) (App registrations → New registration).
2. Add a Web redirect URI matching your deployment, e.g. `https://your-domain/api/auth/entra/callback`.
3. Create a client secret under Certificates & secrets.
4. In the app, open **Settings** (its own admin password, separate from the app lock), enable Password Protection if it isn't already, then fill in the Tenant ID, Application (client) ID, client secret and the same Redirect URI under **Microsoft Entra ID**, and switch it on.

---

## Current Progress

| Module | Status |
|---------|--------|
| Dashboard | ✅ |
| Employees | ✅ |
| Teams | ✅ |
| Duty Rules | ✅ |
| Schedule | ✅ |
| Roster Engine | ✅ |
| Holidays | ✅ |
| Reports | ✅ |
| Settings | ✅ |

---

## Roadmap

### Phase 1 ✅
- ✅ Employee management
- ✅ Team management
- ✅ Duty rules
- ✅ Manual scheduling

### Phase 2 ✅
- ✅ Automatic roster generation
- ✅ Holiday handling
- ✅ Conflict detection

### Phase 3
- ✅ Reporting
- ✅ PDF export
- ⏳ Notifications
- ✅ Authentication (local password lock + Microsoft Entra ID SSO)

---

## License

Private project.
