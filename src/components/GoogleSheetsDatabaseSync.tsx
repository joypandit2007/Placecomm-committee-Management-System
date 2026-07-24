import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Plus, 
  Lock, 
  Cloud, 
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, initAuth, getAccessToken } from '../lib/firebase';
import { 
  provisionStudentDatabase, 
  provisionAdminDatabase, 
  syncStudentDataToSheet, 
  syncAdminDataToSheet,
  SheetCreationResult
} from '../lib/googleSheets';
import { Candidate, Job, AdminFaculty, StudentReview, GoogleSheetsConfig, SyncLogEntry } from '../types';

interface Props {
  candidates: Candidate[];
  jobs: Job[];
  admins: AdminFaculty[];
  reviews: StudentReview[];
  sheetsConfig: GoogleSheetsConfig;
  onUpdateSheetsConfig: (newConfig: GoogleSheetsConfig) => void;
  syncLogs: SyncLogEntry[];
  onAddLog: (log: Omit<SyncLogEntry, 'id' | 'timestamp'>) => void;
}

export default function GoogleSheetsDatabaseSync({
  candidates,
  jobs,
  admins,
  reviews,
  sheetsConfig,
  onUpdateSheetsConfig,
  syncLogs,
  onAddLog
}: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncingStudents, setIsSyncingStudents] = useState(false);
  const [isSyncingAdmins, setIsSyncingAdmins] = useState(false);
  const [isProvisioningStudents, setIsProvisioningStudents] = useState(false);
  const [isProvisioningAdmins, setIsProvisioningAdmins] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        onAddLog({
          category: 'admin',
          action: 'User Authentication',
          status: 'success',
          message: `Authenticated as ${result.user.email} with Google Sheets permissions`
        });
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err.message || 'Google Auth failed. Please check popup permissions.');
      onAddLog({
        category: 'admin',
        action: 'User Authentication',
        status: 'error',
        message: err.message || 'Sign in failed'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    onAddLog({
      category: 'admin',
      action: 'User Sign Out',
      status: 'success',
      message: 'Signed out from Google account'
    });
  };

  // Provision Student Google Sheet
  const handleProvisionStudentSheet = async () => {
    let token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage('Google Authentication token is required. Please Sign in with Google below.');
      return;
    }

    setIsProvisioningStudents(true);
    setErrorMessage(null);
    try {
      const result: SheetCreationResult = await provisionStudentDatabase(token);
      const updatedConfig: GoogleSheetsConfig = {
        ...sheetsConfig,
        studentSheetId: result.spreadsheetId,
        studentSheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString()
      };
      onUpdateSheetsConfig(updatedConfig);

      // Perform immediate sync to write existing candidate data
      const syncRes = await syncStudentDataToSheet(token, result.spreadsheetId, candidates, jobs);

      onAddLog({
        category: 'student',
        action: 'Provision Student Sheet',
        status: 'success',
        message: `Created Student Spreadsheet: ${syncRes.studentRows} student resumes & ${syncRes.appRows} application entries recorded.`,
        rowCount: syncRes.studentRows + syncRes.appRows
      });
    } catch (err: any) {
      console.error('Failed provisioning student sheet:', err);
      setErrorMessage(err.message || 'Failed creating Student Google Sheet');
      onAddLog({
        category: 'student',
        action: 'Provision Student Sheet',
        status: 'error',
        message: err.message || 'Error creating Student Sheet'
      });
    } finally {
      setIsProvisioningStudents(false);
    }
  };

  // Provision Admin Google Sheet
  const handleProvisionAdminSheet = async () => {
    let token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage('Google Authentication token is required. Please Sign in with Google below.');
      return;
    }

    setIsProvisioningAdmins(true);
    setErrorMessage(null);
    try {
      const result: SheetCreationResult = await provisionAdminDatabase(token);
      const updatedConfig: GoogleSheetsConfig = {
        ...sheetsConfig,
        adminSheetId: result.spreadsheetId,
        adminSheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString()
      };
      onUpdateSheetsConfig(updatedConfig);

      // Perform immediate sync to write existing admin data
      const syncRes = await syncAdminDataToSheet(token, result.spreadsheetId, admins, jobs, reviews);

      onAddLog({
        category: 'admin',
        action: 'Provision Admin Sheet',
        status: 'success',
        message: `Created Admin & Faculty Spreadsheet: ${syncRes.adminRows} admin staff, ${syncRes.jobRows} job drives & ${syncRes.reviewRows} reviews recorded.`,
        rowCount: syncRes.adminRows + syncRes.jobRows + syncRes.reviewRows
      });
    } catch (err: any) {
      console.error('Failed provisioning admin sheet:', err);
      setErrorMessage(err.message || 'Failed creating Admin Google Sheet');
      onAddLog({
        category: 'admin',
        action: 'Provision Admin Sheet',
        status: 'error',
        message: err.message || 'Error creating Admin Sheet'
      });
    } finally {
      setIsProvisioningAdmins(false);
    }
  };

  // Sync Student Data to existing sheet
  const handleSyncStudentData = async () => {
    let token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage('Google Authentication token is required. Please Sign in with Google below.');
      return;
    }
    if (!sheetsConfig.studentSheetId) {
      setErrorMessage('No Student Google Sheet linked yet. Click "Provision Student Sheet" first.');
      return;
    }

    setIsSyncingStudents(true);
    setErrorMessage(null);
    try {
      const syncRes = await syncStudentDataToSheet(token, sheetsConfig.studentSheetId, candidates, jobs);
      onUpdateSheetsConfig({
        ...sheetsConfig,
        lastSyncedAt: new Date().toISOString()
      });

      onAddLog({
        category: 'student',
        action: 'Sync Student Records',
        status: 'success',
        message: `Synced ${syncRes.studentRows} student resumes & ${syncRes.appRows} job applications to Google Sheet.`,
        rowCount: syncRes.studentRows + syncRes.appRows
      });
    } catch (err: any) {
      console.error('Student sync failed:', err);
      setErrorMessage(err.message || 'Failed syncing student data');
      onAddLog({
        category: 'student',
        action: 'Sync Student Records',
        status: 'error',
        message: err.message || 'Student sync error'
      });
    } finally {
      setIsSyncingStudents(false);
    }
  };

  // Sync Admin Data to existing sheet
  const handleSyncAdminData = async () => {
    let token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage('Google Authentication token is required. Please Sign in with Google below.');
      return;
    }
    if (!sheetsConfig.adminSheetId) {
      setErrorMessage('No Admin & Professor Google Sheet linked yet. Click "Provision Admin Sheet" first.');
      return;
    }

    setIsSyncingAdmins(true);
    setErrorMessage(null);
    try {
      const syncRes = await syncAdminDataToSheet(token, sheetsConfig.adminSheetId, admins, jobs, reviews);
      onUpdateSheetsConfig({
        ...sheetsConfig,
        lastSyncedAt: new Date().toISOString()
      });

      onAddLog({
        category: 'admin',
        action: 'Sync Admin Records',
        status: 'success',
        message: `Synced ${syncRes.adminRows} admins, ${syncRes.jobRows} job postings & ${syncRes.reviewRows} student reviews to Google Sheet.`,
        rowCount: syncRes.adminRows + syncRes.jobRows + syncRes.reviewRows
      });
    } catch (err: any) {
      console.error('Admin sync failed:', err);
      setErrorMessage(err.message || 'Failed syncing admin data');
      onAddLog({
        category: 'admin',
        action: 'Sync Admin Records',
        status: 'error',
        message: err.message || 'Admin sync error'
      });
    } finally {
      setIsSyncingAdmins(false);
    }
  };

  // Sync both databases in sequence
  const handleSyncAll = async () => {
    if (sheetsConfig.studentSheetId) await handleSyncStudentData();
    if (sheetsConfig.adminSheetId) await handleSyncAdminData();
  };

  return (
    <div className="space-y-8 animate-fade-in" id="google-sheets-db-panel">
      
      {/* Top Banner & OAuth Account Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Separate Database Recording Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Google Sheets Database Sync
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-light leading-relaxed">
              Record and store student ATS resumes and admin/professor directory records in two separate Google Spreadsheets directly inside your Google Drive workspace.
            </p>
          </div>

          {/* User Auth Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl min-w-[280px]">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-emerald-400" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate">{currentUser.displayName || 'Authorized Admin'}</span>
                    <span className="text-[11px] text-emerald-300 block truncate">{currentUser.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Google Drive Connected
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-[10px] font-bold text-red-300 hover:text-red-200 underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-200 font-medium">Connect Google Account to Sync Sheets</p>
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  id="google-signin-btn"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  {isAuthenticating ? 'Connecting...' : 'Sign in with Google'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Database Action Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Database Grid: 2 Columns for Student DB vs Admin DB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* DATABASE 1: STUDENT DATABASE SHEET */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">1. Student Database</h3>
                  <span className="text-slate-400 text-xs font-light block">Google Spreadsheet for Resumes & Job Applications</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                sheetsConfig.studentSheetId 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {sheetsConfig.studentSheetId ? 'Linked & Active' : 'Not Provisioned'}
              </span>
            </div>

            {/* Included Worksheets / Tabs description */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2 text-xs">
              <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Worksheets in Student Google Sheet:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="font-semibold text-slate-800">Students & Resumes</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-semibold text-slate-800">Job Applications</span>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Students Recorded</span>
                <span className="text-2xl font-black text-slate-900">{candidates.length}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Job Fits</span>
                <span className="text-2xl font-black text-indigo-600">
                  {candidates.reduce((acc, curr) => acc + (curr.matchScores ? Object.keys(curr.matchScores).length : 0), 0)}
                </span>
              </div>
            </div>

            {/* Live Sheet Link if provisioned */}
            {sheetsConfig.studentSheetUrl && (
              <a
                href={sheetsConfig.studentSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Open Student Google Sheet in Drive</span>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-500" />
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {!sheetsConfig.studentSheetId ? (
              <button
                onClick={handleProvisionStudentSheet}
                disabled={isProvisioningStudents}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isProvisioningStudents ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning Student Sheet in Drive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Link Student Google Sheet</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSyncStudentData}
                disabled={isSyncingStudents}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isSyncingStudents ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Student Sheet Rows...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Sync Student Database ({candidates.length} Profiles)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* DATABASE 2: ADMIN & PROFESSOR DATABASE SHEET */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">2. Admin & Professor Database</h3>
                  <span className="text-slate-400 text-xs font-light block">Google Spreadsheet for Faculty, Job Drives & Approvals</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                sheetsConfig.adminSheetId 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {sheetsConfig.adminSheetId ? 'Linked & Active' : 'Not Provisioned'}
              </span>
            </div>

            {/* Included Worksheets / Tabs description */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2 text-xs">
              <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Worksheets in Admin Google Sheet:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px] truncate">Admin & Faculty Roster</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px] truncate">Placement Drive Postings</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px] truncate">Verification Reviews</span>
                </div>
              </div>
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Faculty/Admins</span>
                <span className="text-2xl font-black text-slate-900">{admins.length}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Placement Jobs</span>
                <span className="text-2xl font-black text-emerald-600">{jobs.length}</span>
              </div>
              <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Student Reviews</span>
                <span className="text-2xl font-black text-amber-600">{reviews.length}</span>
              </div>
            </div>

            {/* Live Sheet Link if provisioned */}
            {sheetsConfig.adminSheetUrl && (
              <a
                href={sheetsConfig.adminSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Open Admin & Professor Google Sheet in Drive</span>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-600" />
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {!sheetsConfig.adminSheetId ? (
              <button
                onClick={handleProvisionAdminSheet}
                disabled={isProvisioningAdmins}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isProvisioningAdmins ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning Admin Sheet in Drive...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Link Admin Google Sheet</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSyncAdminData}
                disabled={isSyncingAdmins}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isSyncingAdmins ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Admin Sheet Rows...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Sync Admin Database ({admins.length} Staff, {jobs.length} Jobs)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Sync All Button & Auto-Sync Bar */}
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-xs">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-xs block">Master Database Sync Control</span>
            <span className="text-[11px] text-slate-400 block">
              Last master sync: {sheetsConfig.lastSyncedAt ? new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSyncAll}
            disabled={isSyncingStudents || isSyncingAdmins || (!sheetsConfig.studentSheetId && !sheetsConfig.adminSheetId)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingStudents || isSyncingAdmins ? 'animate-spin' : ''}`} />
            <span>Sync Both Spreadsheets Now</span>
          </button>
        </div>
      </div>

      {/* Real-time Activity Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Google Sheets Database Activity Logs
          </h4>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">{syncLogs.length} total events</span>
        </div>

        {syncLogs.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-xs italic">
            No database sync events recorded yet. Connect Google Auth and click "Create & Link" above to start.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {syncLogs.map((log) => (
              <div key={log.id} className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-800 block">{log.action}</span>
                    <span className="text-slate-500 text-[11px] block">{log.message}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`text-[10px] font-bold uppercase ${
                    log.category === 'student' ? 'text-indigo-600' : 'text-emerald-600'
                  }`}>
                    {log.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
