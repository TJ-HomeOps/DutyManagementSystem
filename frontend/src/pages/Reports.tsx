import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import ExcelJS from "exceljs";

import { api } from "../services/api";
import type {
  Currency,
  DutyReport,
  PayLineType,
  Team,
} from "../services/api";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const PAY_TYPE_LABELS: Record<PayLineType, string> = {
  WEEKDAY: "Weekday",
  WEEKEND: "Weekend",
  HOLIDAY: "Holiday",
};

const CURRENCY_LOCALES: Record<Currency, string> = {
  DKK: "da-DK",
  EUR: "de-DE",
};

function getCurrencyFormatter(currency: Currency): Intl.NumberFormat {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

function formatDateRange(start: string, end: string): string {
  return start === end ? start : `${start} – ${end}`;
}

function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0",
  )}`;
}

function formatPeriodLabel(
  periodStart: string,
  periodEnd: string,
): string {
  const start = parseLocalDateKey(periodStart);
  const end = parseLocalDateKey(periodEnd);
  const shortMonth = (d: Date) =>
    MONTH_NAMES[d.getMonth()].slice(0, 3);

  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${start.getDate()}–${end.getDate()} ${shortMonth(
      end,
    )} ${end.getFullYear()}`;
  }

  const startLabel = `${start.getDate()} ${shortMonth(start)}${
    start.getFullYear() === end.getFullYear()
      ? ""
      : ` ${start.getFullYear()}`
  }`;

  return `${startLabel} – ${end.getDate()} ${shortMonth(
    end,
  )} ${end.getFullYear()}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const firstOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );
  const lastOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  );

  return {
    from: formatDateKey(firstOfMonth),
    to: formatDateKey(lastOfMonth),
  };
}

export default function Reports() {
  const theme = useTheme();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");

  const [{ from: fromDate, to: toDate }, setPeriod] =
    useState(defaultPeriod);

  const [report, setReport] = useState<DutyReport | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencyFormatter = useMemo(
    () => getCurrencyFormatter((report?.currency ?? "DKK") as Currency),
    [report?.currency],
  );

  const rangeInvalid = toDate < fromDate;

  useEffect(() => {
    api.teams()
      .then((data) => {
        setTeams(data);

        if (data.length > 0) {
          setTeamId(data[0].id);
        }
      })
      .catch(() => setError("Unable to load teams."));
  }, []);

  useEffect(() => {
    if (!teamId) return;

    if (rangeInvalid) {
      setReport(null);
      setError("End date must not be before start date.");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await api.report(
          teamId,
          fromDate,
          toDate,
        );

        if (!cancelled) {
          setReport(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load report.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [teamId, fromDate, toDate, rangeInvalid]);

  const periodTitle = useMemo(() => {
    if (report) {
      return formatPeriodLabel(
        report.periodStart,
        report.periodEnd,
      );
    }

    if (!rangeInvalid) {
      return formatPeriodLabel(fromDate, toDate);
    }

    return "";
  }, [report, fromDate, toDate, rangeInvalid]);

  const filenameBase = useMemo(() => {
    if (!report) return "duty-report";

    const safeTeam = report.teamName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    return `duty-report-${safeTeam}-${report.periodStart}_to_${report.periodEnd}`;
  }, [report]);

  async function handleExportExcel() {
    if (!report) return;

    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet("Summary");

    summarySheet.columns = [
      { header: "Employee", key: "employee", width: 24 },
      { header: "Days Worked", key: "days", width: 14 },
      { header: `Total Pay (${report.currency})`, key: "pay", width: 16 },
    ];

    for (const s of report.employeeSummaries) {
      summarySheet.addRow({
        employee: s.employeeName,
        days: s.daysWorked,
        pay: s.totalPay,
      });
    }

    summarySheet.addRow({});
    summarySheet.addRow({
      employee: "Total",
      days: report.totals.daysCovered,
      pay: report.totals.totalPay,
    });
    summarySheet.getRow(summarySheet.rowCount).font = {
      bold: true,
    };

    const paySheet = workbook.addWorksheet("Duty Pay");

    paySheet.columns = [
      { header: "Type", key: "type", width: 12 },
      { header: "Employee", key: "employee", width: 24 },
      { header: "Start Date", key: "start", width: 14 },
      { header: "End Date", key: "end", width: 14 },
      { header: `Amount (${report.currency})`, key: "amount", width: 14 },
    ];

    for (const line of report.payLines) {
      paySheet.addRow({
        type: PAY_TYPE_LABELS[line.type],
        employee: line.employeeName,
        start: line.startDate,
        end: line.endDate,
        amount: line.amount,
      });
    }

    const dailySheet = workbook.addWorksheet("Daily Duty");

    dailySheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Weekday", key: "weekday", width: 12 },
      { header: "Employee", key: "employee", width: 24 },
      { header: "Holiday", key: "holiday", width: 24 },
    ];

    for (const entry of report.dailyEntries) {
      dailySheet.addRow({
        date: entry.date,
        weekday: WEEKDAY_LABELS[entry.weekday],
        employee: entry.employeeName,
        holiday: entry.holidayName ?? "",
      });
    }

    for (const sheet of workbook.worksheets) {
      sheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    downloadBlob(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${filenameBase}.xlsx`,
    );
  }

  function handleExportPdf() {
    if (!report) return;

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(
      `Duty Report — ${report.teamName} — ${periodTitle}`,
      14,
      15,
    );

    doc.setFontSize(10);
    doc.text(
      `Days covered: ${report.totals.daysCovered} / ${report.periodDays}    Total pay: ${currencyFormatter.format(report.totals.totalPay)}`,
      14,
      22,
    );

    autoTable(doc, {
      startY: 28,
      head: [["Employee", "Days Worked", "Total Pay"]],
      body: report.employeeSummaries.map((s) => [
        s.employeeName,
        String(s.daysWorked),
        currencyFormatter.format(s.totalPay),
      ]),
      headStyles: { fillColor: [10, 77, 140] },
      styles: { fontSize: 9 },
    });

    const afterSummaryY =
      (
        doc as unknown as {
          lastAutoTable: { finalY: number };
        }
      ).lastAutoTable.finalY + 8;

    doc.setFontSize(11);
    doc.text("Duty Pay", 14, afterSummaryY);

    autoTable(doc, {
      startY: afterSummaryY + 3,
      head: [["Type", "Employee", "Dates", "Amount"]],
      body: report.payLines.map((line) => [
        PAY_TYPE_LABELS[line.type],
        line.employeeName,
        formatDateRange(line.startDate, line.endDate),
        currencyFormatter.format(line.amount),
      ]),
      headStyles: { fillColor: [10, 77, 140] },
      styles: { fontSize: 8 },
    });

    doc.addPage();
    doc.setFontSize(11);
    doc.text(
      `Daily Duty Log — ${report.teamName} — ${periodTitle}`,
      14,
      15,
    );

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Weekday", "Employee", "Holiday"]],
      body: report.dailyEntries.map((entry) => [
        entry.date,
        WEEKDAY_LABELS[entry.weekday],
        entry.employeeName,
        entry.holidayName ?? "",
      ]),
      headStyles: { fillColor: [10, 77, 140] },
      styles: { fontSize: 8 },
    });

    doc.save(`${filenameBase}.pdf`);
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
          >
            Reports
          </Typography>

          <Typography color="text.secondary">
            Duty coverage and pay breakdown for a chosen
            period.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          p: 3,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <TextField
            select
            label="Team"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            label="From"
            value={fromDate}
            onChange={(e) =>
              setPeriod((current) => ({
                ...current,
                from: e.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 170 }}
          />

          <TextField
            type="date"
            label="To"
            value={toDate}
            error={rangeInvalid}
            onChange={(e) =>
              setPeriod((current) => ({
                ...current,
                to: e.target.value,
              }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 170 }}
          />

          {periodTitle && (
            <Typography color="text.secondary">
              {periodTitle}
            </Typography>
          )}

          <Box sx={{ flex: 1 }} />

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={!report || loading}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>

          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            disabled={!report || loading}
            onClick={handleExportPdf}
          >
            Export PDF
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      ) : report ? (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
                flex: 1,
              }}
            >
              <Typography color="text.secondary" gutterBottom>
                Days Covered
              </Typography>

              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {report.totals.daysCovered} /{" "}
                {report.periodDays}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 3,
                flex: 1,
              }}
            >
              <Typography color="text.secondary" gutterBottom>
                Total Pay
              </Typography>

              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {currencyFormatter.format(
                  report.totals.totalPay,
                )}
              </Typography>
            </Paper>
          </Stack>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Employee Summary
          </Typography>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              mb: 4,
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">
                      Days Worked
                    </TableCell>
                    <TableCell align="right">
                      Total Pay
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {report.employeeSummaries.map((s) => (
                    <TableRow key={s.employeeId} hover>
                      <TableCell>{s.employeeName}</TableCell>
                      <TableCell align="right">
                        {s.daysWorked}
                      </TableCell>
                      <TableCell align="right">
                        {currencyFormatter.format(s.totalPay)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {report.employeeSummaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          No duties recorded for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Duty Pay
          </Typography>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              mb: 4,
            }}
          >
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell align="right">
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {report.payLines.map((line, index) => (
                    <TableRow
                      key={`${line.employeeId}-${line.startDate}-${index}`}
                      hover
                    >
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            PAY_TYPE_LABELS[line.type]
                          }
                          sx={{
                            bgcolor:
                              line.type === "WEEKEND"
                                ? alpha(
                                    theme.palette.primary
                                      .main,
                                    0.14,
                                  )
                                : line.type === "HOLIDAY"
                                  ? alpha(
                                      theme.palette.warning
                                        .main,
                                      0.16,
                                    )
                                  : theme.palette.action
                                      .selected,
                            color:
                              line.type === "WEEKEND"
                                ? theme.palette.primary.main
                                : line.type === "HOLIDAY"
                                  ? theme.palette.warning.dark
                                  : theme.palette.text
                                      .secondary,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {line.employeeName}
                      </TableCell>

                      <TableCell>
                        {formatDateRange(
                          line.startDate,
                          line.endDate,
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {currencyFormatter.format(
                          line.amount,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {report.payLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          No duties recorded for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Daily Duty Log
          </Typography>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Weekday</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Holiday</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {report.dailyEntries.map((entry) => (
                    <TableRow key={entry.date} hover>
                      <TableCell>{entry.date}</TableCell>

                      <TableCell>
                        {WEEKDAY_LABELS[entry.weekday]}
                      </TableCell>

                      <TableCell>
                        {entry.employeeName}
                      </TableCell>

                      <TableCell>
                        {entry.holidayName ?? (
                          <Typography
                            component="span"
                            color="text.secondary"
                            variant="body2"
                          >
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {report.dailyEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography
                          color="text.secondary"
                          sx={{ py: 3 }}
                        >
                          No duties recorded for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
