import { Candidate, Job, AdminFaculty, StudentReview } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a new Google Spreadsheet with custom sheet tabs using Google Sheets API v4
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  tabNames: string[]
): Promise<SheetCreationResult> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: tabNames.map((name) => ({
        properties: {
          title: name,
        },
      })),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Failed to create Google Sheet: ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
  };
}

/**
 * Writes or updates headers in A1:Z1 for a given worksheet tab
 */
export async function setSheetHeaders(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  headers: string[]
): Promise<void> {
  const range = `'${tabName}'!A1:${String.fromCharCode(64 + headers.length)}1`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.warn(`Header write warning for ${tabName}:`, err);
  }
}

/**
 * Appends rows to a specified tab in a Google Sheet
 */
export async function appendRowsToSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  rows: (string | number)[][]
): Promise<{ updatedRows: number }> {
  if (rows.length === 0) return { updatedRows: 0 };

  const range = `'${tabName}'!A1`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed appending rows to ${tabName}`);
  }

  const data = await response.json();
  return { updatedRows: data.updates?.updatedRows || rows.length };
}

/**
 * Overwrites entire tab with headers + data rows
 */
export async function overwriteSheetTab(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<void> {
  // Clear existing values
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${tabName}'!A1:Z1000`)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write headers + rows
  const allValues = [headers, ...rows];
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${tabName}'!A1`)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    }
  );
}

// ----------------------------------------------------
// HIGH-LEVEL DATABASE PROVISIONING & SYNCING LOGIC
// ----------------------------------------------------

export const STUDENT_TAB_RESUMES = 'Students & Resumes';
export const STUDENT_TAB_APPLICATIONS = 'Job Applications';

export const ADMIN_TAB_ROSTER = 'Admin & Faculty Roster';
export const ADMIN_TAB_DRIVES = 'Placement Drive Postings';
export const ADMIN_TAB_REVIEWS = 'Student Verification Reviews';

export const STUDENT_RESUME_HEADERS = [
  'Student ID',
  'Full Name',
  'Email',
  'Phone',
  'College',
  'Degree',
  'Branch',
  'Graduation Year',
  'GPA / CGPA',
  'Key Skills',
  'Placement Status',
  'Applied Date',
  'Last Updated',
  'Strengths',
  'Weaknesses',
  'Top Recommended Roles',
  'Notes',
];

export const STUDENT_APPLICATION_HEADERS = [
  'Candidate ID',
  'Student Name',
  'Student Email',
  'Job ID',
  'Job Title & Company',
  'Match Score (%)',
  'Application Status',
  'Last Updated',
];

export const ADMIN_ROSTER_HEADERS = [
  'Admin ID',
  'Full Name',
  'Email',
  'Phone',
  'Department',
  'Role / Designation',
  'Assigned Branch',
  'Status',
  'Joined Date',
  'Notes',
];

export const ADMIN_DRIVES_HEADERS = [
  'Job ID',
  'Company',
  'Role',
  'Location',
  'Min GPA Requirement',
  'Salary / CTC',
  'Eligibility Criteria',
  'Required Skills',
  'Status',
  'Created Date',
];

export const ADMIN_REVIEWS_HEADERS = [
  'Review ID',
  'Student Name',
  'Candidate ID',
  'Reviewing Professor / Admin',
  'Admin Email',
  'Verification Status',
  'Feedback / Notes',
  'Date Reviewed',
];

/**
 * Provision Student Database Google Sheet
 */
export async function provisionStudentDatabase(accessToken: string): Promise<SheetCreationResult> {
  const result = await createSpreadsheet(
    accessToken,
    `Placement Club - Student Database (${new Date().toLocaleDateString()})`,
    [STUDENT_TAB_RESUMES, STUDENT_TAB_APPLICATIONS]
  );

  // Set initial headers
  await setSheetHeaders(accessToken, result.spreadsheetId, STUDENT_TAB_RESUMES, STUDENT_RESUME_HEADERS);
  await setSheetHeaders(accessToken, result.spreadsheetId, STUDENT_TAB_APPLICATIONS, STUDENT_APPLICATION_HEADERS);

  return result;
}

/**
 * Provision Admin & Faculty Database Google Sheet
 */
export async function provisionAdminDatabase(accessToken: string): Promise<SheetCreationResult> {
  const result = await createSpreadsheet(
    accessToken,
    `Placement Club - Admin & Faculty Database (${new Date().toLocaleDateString()})`,
    [ADMIN_TAB_ROSTER, ADMIN_TAB_DRIVES, ADMIN_TAB_REVIEWS]
  );

  // Set initial headers
  await setSheetHeaders(accessToken, result.spreadsheetId, ADMIN_TAB_ROSTER, ADMIN_ROSTER_HEADERS);
  await setSheetHeaders(accessToken, result.spreadsheetId, ADMIN_TAB_DRIVES, ADMIN_DRIVES_HEADERS);
  await setSheetHeaders(accessToken, result.spreadsheetId, ADMIN_TAB_REVIEWS, ADMIN_REVIEWS_HEADERS);

  return result;
}

/**
 * Sync entire Student collection to linked Student Google Sheet
 */
export async function syncStudentDataToSheet(
  accessToken: string,
  spreadsheetId: string,
  candidates: Candidate[],
  jobs: Job[]
): Promise<{ studentRows: number; appRows: number }> {
  // Format student rows
  const studentRows = candidates.map((c) => [
    c.id,
    c.name,
    c.email,
    c.phone,
    c.college,
    c.degree,
    c.branch,
    c.graduationYear,
    c.gpa,
    (c.skills || []).join(', '),
    c.status.toUpperCase(),
    c.appliedDate,
    c.lastUpdated,
    (c.feedback?.strengths || []).join(' | '),
    (c.feedback?.weaknesses || []).join(' | '),
    (c.feedback?.recommendedRoles || []).join(', '),
    c.notes || '',
  ]);

  // Format application rows
  const appRows: (string | number)[][] = [];
  candidates.forEach((c) => {
    if (c.matchScores) {
      Object.entries(c.matchScores).forEach(([jobId, score]) => {
        const matchedJob = jobs.find((j) => j.id === jobId);
        appRows.push([
          c.id,
          c.name,
          c.email,
          jobId,
          matchedJob ? `${matchedJob.role} @ ${matchedJob.company}` : jobId,
          `${score}%`,
          c.status.toUpperCase(),
          c.lastUpdated,
        ]);
      });
    }
  });

  await overwriteSheetTab(accessToken, spreadsheetId, STUDENT_TAB_RESUMES, STUDENT_RESUME_HEADERS, studentRows);
  await overwriteSheetTab(
    accessToken,
    spreadsheetId,
    STUDENT_TAB_APPLICATIONS,
    STUDENT_APPLICATION_HEADERS,
    appRows
  );

  return { studentRows: studentRows.length, appRows: appRows.length };
}

/**
 * Sync entire Admin & Professor collection to linked Admin Google Sheet
 */
export async function syncAdminDataToSheet(
  accessToken: string,
  spreadsheetId: string,
  admins: AdminFaculty[],
  jobs: Job[],
  reviews: StudentReview[]
): Promise<{ adminRows: number; jobRows: number; reviewRows: number }> {
  const adminRows = admins.map((a) => [
    a.id,
    a.name,
    a.email,
    a.phone,
    a.department,
    a.role,
    a.assignedBranch,
    a.status.toUpperCase(),
    a.joinedDate,
    a.notes || '',
  ]);

  const jobRows = jobs.map((j) => [
    j.id,
    j.company,
    j.role,
    j.location,
    j.minGpa,
    j.salary,
    j.eligibility,
    (j.skillsRequired || []).join(', '),
    j.status.toUpperCase(),
    j.createdDate,
  ]);

  const reviewRows = reviews.map((r) => [
    r.id,
    r.candidateName,
    r.candidateId,
    r.reviewedByAdminName,
    r.reviewedByAdminEmail,
    r.verificationStatus,
    r.feedbackNotes,
    r.dateReviewed,
  ]);

  await overwriteSheetTab(accessToken, spreadsheetId, ADMIN_TAB_ROSTER, ADMIN_ROSTER_HEADERS, adminRows);
  await overwriteSheetTab(accessToken, spreadsheetId, ADMIN_TAB_DRIVES, ADMIN_DRIVES_HEADERS, jobRows);
  await overwriteSheetTab(accessToken, spreadsheetId, ADMIN_TAB_REVIEWS, ADMIN_REVIEWS_HEADERS, reviewRows);

  return {
    adminRows: adminRows.length,
    jobRows: jobRows.length,
    reviewRows: reviewRows.length,
  };
}
