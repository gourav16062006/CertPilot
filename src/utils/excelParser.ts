import * as XLSX from "xlsx";
import { Recipient } from "../types";

export interface ParseResult {
  recipients: Recipient[];
  columns: string[];
  hasEmailColumn: boolean;
  warnings: string[];
}

/**
 * Parse an Excel (.xlsx, .xls) or CSV file into structured recipients
 */
export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No sheet found in uploaded spreadsheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new Error("The uploaded file does not contain any data rows.");
  }

  // Extract all unique column headers across rows
  const columnSet = new Set<string>();
  rawRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const trimmed = key.trim();
      if (trimmed) columnSet.add(trimmed);
    });
  });

  const columns = Array.from(columnSet);
  const warnings: string[] = [];

  // Match column names flexibly (case-insensitive)
  const findColumn = (possibleNames: string[]): string | undefined => {
    return columns.find((col) =>
      possibleNames.some((name) => col.toLowerCase().trim() === name.toLowerCase().trim())
    );
  };

  const nameCol = findColumn(["name", "full name", "recipient", "student name", "participant"]);
  const emailCol = findColumn(["email", "e-mail", "email address", "mail", "recipient email"]);
  const courseCol = findColumn(["course", "event", "program", "workshop", "title", "subject"]);
  const dateCol = findColumn(["date", "completion date", "issue date", "awarded date"]);
  const certIdCol = findColumn(["certificate id", "certificate_id", "cert id", "id", "credential id"]);

  const hasEmailColumn = Boolean(emailCol);
  if (!hasEmailColumn) {
    warnings.push("No obvious 'Email' column detected. Please ensure an email column exists for bulk emailing.");
  }

  const recipients: Recipient[] = rawRows.map((row, idx) => {
    const rawName = nameCol ? String(row[nameCol] || "") : (row["Name"] || row["name"] || `Recipient ${idx + 1}`);
    const rawEmail = emailCol ? String(row[emailCol] || "") : (row["Email"] || row["email"] || "");
    const rawCourse = courseCol ? String(row[courseCol] || "") : (row["Course"] || row["course"] || "");
    const rawDate = dateCol ? String(row[dateCol] || "") : (row["Date"] || row["date"] || "14 September 2026");
    const rawCertId = certIdCol
      ? String(row[certIdCol] || "")
      : (row["Certificate ID"] || row["certificate_id"] || `WM-${new Date().getFullYear()}-${String(idx + 1).padStart(4, "0")}`);

    const recipientObj: Recipient = {
      _id: `rec-${Date.now()}-${idx}-${Math.random().toString(36).substring(6)}`,
      name: rawName.trim(),
      email: rawEmail.trim(),
      course: rawCourse.trim(),
      date: rawDate.trim(),
      certificate_id: rawCertId.trim(),
      _status: "pending",
    };

    // Also populate raw spreadsheet column keys for arbitrary custom mapping like {{department}}, {{grade}}, etc.
    Object.keys(row).forEach((k) => {
      const cleanKey = k.trim();
      recipientObj[cleanKey] = row[k];
      recipientObj[cleanKey.toLowerCase()] = row[k];
    });

    return recipientObj;
  });

  return {
    recipients,
    columns,
    hasEmailColumn,
    warnings,
  };
}

/**
 * Generates and triggers download of a sample CSV/Excel file for users
 */
export function downloadSampleSpreadsheet(format: "xlsx" | "csv" = "xlsx") {
  const sampleData = [
    {
      "Name": "Rahul Sharma",
      "Email": "rahul.sharma@example.com",
      "Course": "Full Stack Development & Cloud Architecture",
      "Date": "14 September 2026",
      "Certificate ID": "WM-2026-0814",
    },
    {
      "Name": "Priya Singh",
      "Email": "priya.singh@example.com",
      "Course": "AI & Machine Learning Engineering",
      "Date": "14 September 2026",
      "Certificate ID": "WM-2026-0815",
    },
    {
      "Name": "Aman Kumar",
      "Email": "aman.kumar@example.com",
      "Course": "Cybersecurity & Network Defense",
      "Date": "14 September 2026",
      "Certificate ID": "WM-2026-0816",
    },
    {
      "Name": "Sneha Patel",
      "Email": "sneha.patel@example.com",
      "Course": "UI/UX Design Systems & Product Strategy",
      "Date": "14 September 2026",
      "Certificate ID": "WM-2026-0817",
    },
    {
      "Name": "David Chen",
      "Email": "david.chen@example.com",
      "Course": "Advanced Data Engineering with Python",
      "Date": "14 September 2026",
      "Certificate ID": "CP-2026-0818",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");

  const fileName = `CertPilot_Sample_Recipients.${format}`;
  XLSX.writeFile(workbook, fileName, { bookType: format });
}
