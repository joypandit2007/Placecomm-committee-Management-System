import React, { useState } from 'react';
import AtsReviewer from './components/AtsReviewer';
import GoogleSheetsDatabaseSync from './components/GoogleSheetsDatabaseSync';
import AdminFacultyManager from './components/AdminFacultyManager';
import StudentDatabaseTable from './components/StudentDatabaseTable';
import { sampleCandidates, sampleJobs, sampleAdmins, sampleReviews } from './data/sampleData';
import { Candidate, Job, AdminFaculty, StudentReview, GoogleSheetsConfig, SyncLogEntry } from './types';
import { getAccessToken } from './lib/firebase';
import { syncStudentDataToSheet, syncAdminDataToSheet } from './lib/googleSheets';
import { 
  FileCheck, 
  FileSpreadsheet, 
  UserCheck, 
  Users, 
  Moon, 
  Sun, 
  Shield, 
  Info, 
  Sparkles,
  Database,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'ats' | 'sheets' | 'admins' | 'students'>('ats');

  // Database Collections State
  const [candidates, setCandidates] = useState<Candidate[]>(sampleCandidates);
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);
  const [admins, setAdmins] = useState<AdminFaculty[]>(sampleAdmins);
  const [reviews, setReviews] = useState<StudentReview[]>(sampleReviews);

  // Google Sheets Config State
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({
    studentSheetId: null,
    studentSheetUrl: null,
    adminSheetId: null,
    adminSheetUrl: null,
    autoSync: true,
    lastSyncedAt: null
  });

  // Database Activity Logs State
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      category: 'admin',
      action: 'Database Initialization',
      status: 'success',
      message: 'Separate Student and Admin/Professor database structure initialized.'
    }
  ]);

  const addLog = (log: Omit<SyncLogEntry, 'id' | 'timestamp'>) => {
    const entry: SyncLogEntry = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    setSyncLogs((prev) => [entry, ...prev]);
  };

  // Callback to add new Candidate
  const handleAddCandidate = async (newCand: Candidate) => {
    const updated = [newCand, ...candidates];
    setCandidates(updated);

    // Auto sync to Google Sheets if linked
    if (sheetsConfig.studentSheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await syncStudentDataToSheet(token, sheetsConfig.studentSheetId, updated, jobs);
          addLog({
            category: 'student',
            action: 'Auto-Sync Candidate',
            status: 'success',
            message: `Recorded ${newCand.name} to Student Google Sheet.`,
            rowCount: res.studentRows
          });
        } catch (err: any) {
          console.error('Auto-sync candidate error:', err);
        }
      }
    }
  };

  // Callback to add new Admin/Professor
  const handleAddAdmin = async (newAdmin: AdminFaculty) => {
    const updated = [newAdmin, ...admins];
    setAdmins(updated);

    if (sheetsConfig.adminSheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await syncAdminDataToSheet(token, sheetsConfig.adminSheetId, updated, jobs, reviews);
          addLog({
            category: 'admin',
            action: 'Auto-Sync Faculty Record',
            status: 'success',
            message: `Recorded ${newAdmin.name} (${newAdmin.role}) to Admin Google Sheet.`,
            rowCount: res.adminRows
          });
        } catch (err: any) {
          console.error('Auto-sync admin error:', err);
        }
      }
    }
  };

  // Callback to add new Student Review
  const handleAddReview = async (newReview: StudentReview) => {
    const updated = [newReview, ...reviews];
    setReviews(updated);

    if (sheetsConfig.adminSheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await syncAdminDataToSheet(token, sheetsConfig.adminSheetId, admins, jobs, updated);
          addLog({
            category: 'review',
            action: 'Auto-Sync Faculty Review',
            status: 'success',
            message: `Recorded review for ${newReview.candidateName} by ${newReview.reviewedByAdminName} to Admin Google Sheet.`,
            rowCount: res.reviewRows
          });
        } catch (err: any) {
          console.error('Auto-sync review error:', err);
        }
      }
    }
  };

  // Trigger manual sync for Student Google Sheet
  const handleTriggerStudentSync = async () => {
    if (!sheetsConfig.studentSheetId) return;
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await syncStudentDataToSheet(token, sheetsConfig.studentSheetId, candidates, jobs);
      addLog({
        category: 'student',
        action: 'Manual Student Sync',
        status: 'success',
        message: `Synced ${res.studentRows} student rows to Student Google Sheet.`,
        rowCount: res.studentRows
      });
    } catch (err: any) {
      addLog({
        category: 'student',
        action: 'Manual Student Sync',
        status: 'error',
        message: err.message || 'Student sync error'
      });
    }
  };

  // Trigger manual sync for Admin Google Sheet
  const handleTriggerAdminSync = async () => {
    if (!sheetsConfig.adminSheetId) return;
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await syncAdminDataToSheet(token, sheetsConfig.adminSheetId, admins, jobs, reviews);
      addLog({
        category: 'admin',
        action: 'Manual Admin Sync',
        status: 'success',
        message: `Synced ${res.adminRows} admin staff & ${res.jobRows} job drives to Admin Google Sheet.`,
        rowCount: res.adminRows + res.jobRows
      });
    } catch (err: any) {
      addLog({
        category: 'admin',
        action: 'Manual Admin Sync',
        status: 'error',
        message: err.message || 'Admin sync error'
      });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} id="applet-shell">
      
      {/* Top Header Navigation */}
      <nav className={`border-b shrink-0 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 z-30 shadow-xs transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-sm shadow-indigo-500/20">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className={`font-extrabold text-base tracking-tight block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Placement Club <span className="text-indigo-600 font-extrabold">Database ATS</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Google Sheets Database Recording</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveMainTab('ats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'ats'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>ATS Reviewer</span>
          </button>

          <button
            onClick={() => setActiveMainTab('sheets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'sheets'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            id="google-sheets-tab"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Sheets Sync</span>
            {(sheetsConfig.studentSheetId || sheetsConfig.adminSheetId) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('admins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'admins'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admins & Professors</span>
            <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-md text-[10px]">
              {admins.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMainTab === 'students'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Student Database</span>
            <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-md text-[10px]">
              {candidates.length}
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {/* Privacy badge */}
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isDarkMode ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Separate Google Sheets DB
          </span>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Main App Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8" id="main-content-pane">
        <div className="max-w-7xl mx-auto w-full animate-fade-in">
          {activeMainTab === 'ats' && (
            <AtsReviewer />
          )}

          {activeMainTab === 'sheets' && (
            <GoogleSheetsDatabaseSync
              candidates={candidates}
              jobs={jobs}
              admins={admins}
              reviews={reviews}
              sheetsConfig={sheetsConfig}
              onUpdateSheetsConfig={setSheetsConfig}
              syncLogs={syncLogs}
              onAddLog={addLog}
            />
          )}

          {activeMainTab === 'admins' && (
            <AdminFacultyManager
              admins={admins}
              onAddAdmin={handleAddAdmin}
              reviews={reviews}
              onAddReview={handleAddReview}
              candidates={candidates}
              onTriggerAdminSync={handleTriggerAdminSync}
              isSheetLinked={!!sheetsConfig.adminSheetId}
            />
          )}

          {activeMainTab === 'students' && (
            <StudentDatabaseTable
              candidates={candidates}
              jobs={jobs}
              onAddCandidate={handleAddCandidate}
              onTriggerStudentSync={handleTriggerStudentSync}
              isSheetLinked={!!sheetsConfig.studentSheetId}
            />
          )}
        </div>
      </main>

      {/* Humble Footer with details */}
      <footer className={`h-12 border-t shrink-0 px-6 flex items-center justify-between text-[11px] transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
      }`}>
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Google Sheets Database: Recording Students & Admins/Professors in two separate Google Spreadsheets.</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {sheetsConfig.studentSheetUrl && (
            <a href={sheetsConfig.studentSheetUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
              <span>Student Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {sheetsConfig.adminSheetUrl && (
            <a href={sheetsConfig.adminSheetUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
              <span>Admin Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <span>Version 2.2.0</span>
        </div>
      </footer>

    </div>
  );
}
