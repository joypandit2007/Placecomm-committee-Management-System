export interface Experience {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface Project {
  title: string;
  technologies: string[];
  description: string;
}

export interface GeminiFeedback {
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  recommendedRoles: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  degree: string;
  branch: string;
  graduationYear: string;
  gpa: number;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  status: 'applied' | 'screening' | 'technical' | 'hr' | 'offered' | 'placed' | 'rejected';
  appliedDate: string;
  lastUpdated: string;
  notes: string;
  feedback?: GeminiFeedback;
  matchScores?: Record<string, number>; // JobId -> Score
}

export interface Job {
  id: string;
  company: string;
  role: string;
  logoUrl?: string;
  description: string;
  skillsRequired: string[];
  minGpa: number;
  location: string;
  salary: string;
  eligibility: string;
  status: 'active' | 'closed';
  createdDate: string;
}

export interface PlacementStats {
  totalStudents: number;
  placedStudents: number;
  placedPercentage: number;
  averagePackage: string;
  topPackage: string;
  totalJobs: number;
  stageDistribution: Record<string, number>;
}

export interface AdminFaculty {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: 'Training & Placement Officer' | 'Department HOD' | 'Assistant Professor' | 'Placement Coordinator' | 'System Admin';
  assignedBranch: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  notes?: string;
}

export interface StudentReview {
  id: string;
  candidateId: string;
  candidateName: string;
  reviewedByAdminName: string;
  reviewedByAdminEmail: string;
  verificationStatus: 'Approved for Placement' | 'Pending Review' | 'Needs Resume Update' | 'Flagged';
  feedbackNotes: string;
  dateReviewed: string;
}

export interface GoogleSheetsConfig {
  studentSheetId: string | null;
  studentSheetUrl: string | null;
  adminSheetId: string | null;
  adminSheetUrl: string | null;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  category: 'student' | 'admin' | 'job' | 'review';
  action: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  rowCount?: number;
}

