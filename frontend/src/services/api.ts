const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    // "include" rather than the same-origin default: the session cookie for
    // the password lock must still be sent if VITE_API_URL ever points at a
    // different origin than the page (the backend's CORS config allows this).
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();

    // Nest's error responses are JSON ({ message, error, statusCode });
    // unwrap that instead of surfacing the raw body to the user.
    let message = "";

    try {
      message =
        (JSON.parse(body) as { message?: string }).message ??
        "";
    } catch {
      // Not JSON; fall back to the raw text below.
    }

    throw new Error(
      message || body || `API Error ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface DashboardResponse {
  stats: {
    employees: number;
    teams: number;
    rules: number;
    assignments: number;
  };
  todayDuty: any;
  upcoming: any[];
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  color?: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  team: Team;
}

export interface DutyAssignment {
  id: string;
  teamId: string;
  employeeId: string;
  start: string;
  end: string;
  notes?: string;

  employee: Employee;
  team: Team;

  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  name: string;
  department: string;
  teamId: string;
}

export interface UpdateEmployeeDto {
  name?: string;
  department?: string;
  teamId?: string;
}

export interface CreateAssignmentDto {
  teamId: string;
  employeeId: string;
  start: string;
  end: string;
  notes?: string;
}

export interface UpdateAssignmentDto {
  teamId?: string;
  employeeId?: string;
  start?: string;
  end?: string;
  notes?: string;
}

export type DutyRuleType = "FIXED" | "MANUAL" | "ROTATION";

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface DutyRule {
  id: string;
  teamId: string;
  weekday: Weekday;
  ruleType: DutyRuleType;
  employeeId: string | null;
  active: boolean;
  team: Team;
  employee: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDutyRuleDto {
  teamId: string;
  weekday: Weekday;
  ruleType: DutyRuleType;
  employeeId?: string;
  active?: boolean;
}

export interface UpdateDutyRuleDto {
  teamId?: string;
  weekday?: Weekday;
  ruleType?: DutyRuleType;
  employeeId?: string;
  active?: boolean;
}

export interface Holiday {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
  employeeId: string | null;
  employee: Employee | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  startDate: string;
  endDate: string;
  name: string;
  employeeId?: string | null;
}

export interface UpdateHolidayDto {
  startDate?: string;
  endDate?: string;
  name?: string;
  employeeId?: string | null;
}

export interface RosterDayPlan {
  date: string;
  weekday: string;
  ruleType: DutyRuleType | null;
  ruleEmployeeId: string | null;
  ruleEmployeeName: string | null;
  existingAssignmentId: string | null;
  existingEmployeeId: string | null;
  existingEmployeeName: string | null;
  isHoliday: boolean;
  holidayName: string | null;
  holidayEmployeeName: string | null;
  status: "existing" | "planned" | "unassigned" | "holiday";
}

export interface RosterGenerateResult {
  created: RosterDayPlan[];
  updated: RosterDayPlan[];
  skipped: RosterDayPlan[];
}

export type PayLineType = "WEEKDAY" | "WEEKEND" | "HOLIDAY";

export interface DailyDutyEntry {
  date: string;
  weekday: Weekday;
  employeeId: string;
  employeeName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface PayLine {
  type: PayLineType;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  daysWorked: number;
  totalPay: number;
}

export interface DutyReport {
  teamId: string;
  teamName: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  dailyEntries: DailyDutyEntry[];
  payLines: PayLine[];
  employeeSummaries: EmployeeSummary[];
  totals: {
    daysCovered: number;
    totalPay: number;
  };
}

export interface AuthStatus {
  enabled: boolean;
  entra: {
    enabled: boolean;
  };
}

export interface SettingsStatus {
  configured: boolean;
}

export interface EntraConfig {
  enabled: boolean;
  tenantId: string | null;
  clientId: string | null;
  redirectUri: string | null;
  hasClientSecret: boolean;
}

export interface UpdateEntraConfigDto {
  enabled: boolean;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

// Full page navigation, not a fetch() call — the browser needs to follow
// the 302 chain out to Microsoft and back.
export const entraLoginUrl = `${API_BASE}/auth/entra/login`;

export const api = {
  //
  // Dashboard
  //
  dashboard: () =>
    request<DashboardResponse>("/dashboard"),

  //
  // Employees
  //
  employees: () =>
    request<Employee[]>("/employees"),

  createEmployee: (
    employee: CreateEmployeeDto,
  ) =>
    request<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(employee),
    }),

  updateEmployee: (
    id: string,
    employee: UpdateEmployeeDto,
  ) =>
    request<Employee>(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(employee),
    }),

  deleteEmployee: (id: string) =>
    request<void>(`/employees/${id}`, {
      method: "DELETE",
    }),

  //
  // Teams
  //
  teams: () =>
    request<Team[]>("/teams"),

  createTeam: (team: CreateTeamDto) =>
    request<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(team),
    }),

  updateTeam: (id: string, team: UpdateTeamDto) =>
    request<Team>(`/teams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(team),
    }),

  deleteTeam: (id: string) =>
    request<void>(`/teams/${id}`, {
      method: "DELETE",
    }),

  //
  // Duty Rules
  //
  dutyRules: () =>
    request<DutyRule[]>("/duty-rules"),

  createDutyRule: (rule: CreateDutyRuleDto) =>
    request<DutyRule>("/duty-rules", {
      method: "POST",
      body: JSON.stringify(rule),
    }),

  updateDutyRule: (id: string, rule: UpdateDutyRuleDto) =>
    request<DutyRule>(`/duty-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(rule),
    }),

  deleteDutyRule: (id: string) =>
    request<void>(`/duty-rules/${id}`, {
      method: "DELETE",
    }),

  //
  // Schedule
  //
  getSchedule: (
    start: string,
    end: string,
  ) =>
    request<DutyAssignment[]>(
      `/schedule?start=${encodeURIComponent(
        start,
      )}&end=${encodeURIComponent(end)}`,
    ),

  getScheduleMonth: (
    year: number,
    month: number,
  ) =>
    request<DutyAssignment[]>(
      `/schedule/month?year=${year}&month=${month}`,
    ),

  createAssignment: (
    assignment: CreateAssignmentDto,
  ) =>
    request<DutyAssignment>("/schedule", {
      method: "POST",
      body: JSON.stringify(assignment),
    }),

  updateAssignment: (
    id: string,
    assignment: UpdateAssignmentDto,
  ) =>
    request<DutyAssignment>(
      `/schedule/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(assignment),
      },
    ),

  deleteAssignment: (id: string) =>
    request<void>(`/schedule/${id}`, {
      method: "DELETE",
    }),

  //
  // Holidays
  //
  holidays: () =>
    request<Holiday[]>("/holidays"),

  createHoliday: (holiday: CreateHolidayDto) =>
    request<Holiday>("/holidays", {
      method: "POST",
      body: JSON.stringify(holiday),
    }),

  updateHoliday: (id: string, holiday: UpdateHolidayDto) =>
    request<Holiday>(`/holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(holiday),
    }),

  deleteHoliday: (id: string) =>
    request<void>(`/holidays/${id}`, {
      method: "DELETE",
    }),

  //
  // Roster
  //
  rosterPreview: (
    teamId: string,
    year: number,
    month: number,
  ) =>
    request<RosterDayPlan[]>(
      `/roster/preview?teamId=${encodeURIComponent(
        teamId,
      )}&year=${year}&month=${month}`,
    ),

  rosterGenerate: (
    teamId: string,
    year: number,
    month: number,
    overwrite: boolean,
  ) =>
    request<RosterGenerateResult>("/roster/generate", {
      method: "POST",
      body: JSON.stringify({
        teamId,
        year,
        month,
        overwrite,
      }),
    }),

  //
  // Reports
  //
  report: (teamId: string, start: string, end: string) =>
    request<DutyReport>(
      `/reports/range?teamId=${encodeURIComponent(
        teamId,
      )}&start=${encodeURIComponent(
        start,
      )}&end=${encodeURIComponent(end)}`,
    ),

  //
  // Auth (app-wide password lock)
  //
  authStatus: () =>
    request<AuthStatus>("/auth/status"),

  authSession: () =>
    request<{ ok: true }>("/auth/session"),

  login: (password: string) =>
    request<{ ok: true }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  //
  // Settings (admin-only area, gated by its own password)
  //
  settingsStatus: () =>
    request<SettingsStatus>("/settings/status"),

  settingsSession: () =>
    request<{ ok: true }>("/settings/session"),

  settingsLogin: (password: string) =>
    request<{ ok: true }>("/settings/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  setSettingsPassword: (password: string) =>
    request<{ ok: true }>("/settings/password", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  enableLock: (password: string) =>
    request<{ ok: true }>("/settings/lock/enable", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  disableLock: () =>
    request<{ ok: true }>("/settings/lock/disable", {
      method: "POST",
    }),

  getEntraConfig: () =>
    request<EntraConfig>("/settings/entra"),

  updateEntraConfig: (dto: UpdateEntraConfigDto) =>
    request<EntraConfig>("/settings/entra", {
      method: "PUT",
      body: JSON.stringify(dto),
    }),
};
