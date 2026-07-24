import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  X, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { AdminFaculty, StudentReview, Candidate } from '../types';

interface Props {
  admins: AdminFaculty[];
  onAddAdmin: (newAdmin: AdminFaculty) => void;
  reviews: StudentReview[];
  onAddReview: (newReview: StudentReview) => void;
  candidates: Candidate[];
  onTriggerAdminSync: () => void;
  isSheetLinked: boolean;
}

export default function AdminFacultyManager({
  admins,
  onAddAdmin,
  reviews,
  onAddReview,
  candidates,
  onTriggerAdminSync,
  isSheetLinked
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // New Admin Form state
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Training & Placement Office',
    role: 'Placement Coordinator' as AdminFaculty['role'],
    assignedBranch: 'Computer Science & IT',
    notes: ''
  });

  // Student Review Form state
  const [reviewForm, setReviewForm] = useState({
    candidateId: candidates[0]?.id || '',
    reviewedByAdminId: admins[0]?.id || '',
    verificationStatus: 'Approved for Placement' as StudentReview['verificationStatus'],
    feedbackNotes: ''
  });

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) return;

    const created: AdminFaculty = {
      id: `admin-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      phone: newAdmin.phone || '+91 98000 00000',
      department: newAdmin.department,
      role: newAdmin.role,
      assignedBranch: newAdmin.assignedBranch,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      notes: newAdmin.notes
    };

    onAddAdmin(created);
    setShowAddAdminModal(false);
    setNewAdmin({
      name: '',
      email: '',
      phone: '',
      department: 'Training & Placement Office',
      role: 'Placement Coordinator',
      assignedBranch: 'Computer Science & IT',
      notes: ''
    });

    if (isSheetLinked) {
      onTriggerAdminSync();
    }
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = candidates.find((c) => c.id === reviewForm.candidateId);
    const admin = admins.find((a) => a.id === reviewForm.reviewedByAdminId);

    if (!candidate || !admin) return;

    const review: StudentReview = {
      id: `rev-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      reviewedByAdminName: admin.name,
      reviewedByAdminEmail: admin.email,
      verificationStatus: reviewForm.verificationStatus,
      feedbackNotes: reviewForm.feedbackNotes || 'Verified academic standing and resume alignment.',
      dateReviewed: new Date().toISOString().split('T')[0]
    };

    onAddReview(review);
    setShowReviewModal(false);
    setReviewForm({
      candidateId: candidates[0]?.id || '',
      reviewedByAdminId: admins[0]?.id || '',
      verificationStatus: 'Approved for Placement',
      feedbackNotes: ''
    });

    if (isSheetLinked) {
      onTriggerAdminSync();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-faculty-manager">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            Faculty & Administrative Database
          </div>
          <h2 className="text-xl font-black text-slate-900">Admins & Professors Management</h2>
          <p className="text-slate-400 text-xs font-light">
            Record training officers, department professors, and faculty reviewers. Changes record automatically to the Admin Google Sheet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReviewModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Verify Student Resume</span>
          </button>

          <button
            onClick={() => setShowAddAdminModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin / Professor</span>
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search admins by name, role or dept..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {isSheetLinked && (
          <button
            onClick={onTriggerAdminSync}
            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Sync to Admin Google Sheet</span>
          </button>
        )}
      </div>

      {/* Admin Faculty Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm border border-emerald-200">
                    {admin.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{admin.name}</h3>
                    <span className="text-[11px] font-semibold text-emerald-700 block">{admin.role}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase">
                  {admin.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{admin.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-indigo-600 font-medium">{admin.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{admin.phone}</span>
                </div>
              </div>

              {admin.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic font-light">
                  "{admin.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Branch: {admin.assignedBranch}</span>
              <span>Joined: {admin.joinedDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Faculty Student Reviews Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Faculty Resume Approvals & Student Reviews
            </h3>
            <p className="text-slate-400 text-xs font-light">
              Recorded review entries generated by faculty members for placement eligibility.
            </p>
          </div>

          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {reviews.length} Verified Reviews
          </span>
        </div>

        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{rev.candidateName}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    rev.verificationStatus === 'Approved for Placement'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {rev.verificationStatus}
                  </span>
                </div>
                <p className="text-slate-600 font-light">"{rev.feedbackNotes}"</p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-semibold text-slate-700 block">Reviewed by {rev.reviewedByAdminName}</span>
                <span className="text-[10px] text-slate-400 block">{rev.dateReviewed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Add Admin / Professor */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Add Admin or Professor</h3>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@college.edu"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Computer Science & Engineering"
                  value={newAdmin.department}
                  onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminFaculty['role'] })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Training & Placement Officer">Training & Placement Officer</option>
                    <option value="Department HOD">Department HOD</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Placement Coordinator">Placement Coordinator</option>
                    <option value="System Admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Branch</label>
                  <input
                    type="text"
                    placeholder="All Branches"
                    value={newAdmin.assignedBranch}
                    onChange={(e) => setNewAdmin({ ...newAdmin, assignedBranch: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Roles</label>
                <textarea
                  rows={2}
                  placeholder="Handles campus visits for IT companies..."
                  value={newAdmin.notes}
                  onChange={(e) => setNewAdmin({ ...newAdmin, notes: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Save to Admin Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Verify Student Resume (Professor Action) */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Faculty Student Verification Review</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student Candidate *</label>
                <select
                  value={reviewForm.candidateId}
                  onChange={(e) => setReviewForm({ ...reviewForm, candidateId: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.branch} - GPA {c.gpa})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reviewing Professor / Admin *</label>
                <select
                  value={reviewForm.reviewedByAdminId}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewedByAdminId: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={reviewForm.verificationStatus}
                  onChange={(e) => setReviewForm({ ...reviewForm, verificationStatus: e.target.value as StudentReview['verificationStatus'] })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Approved for Placement">Approved for Placement</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Needs Resume Update">Needs Resume Update</option>
                  <option value="Flagged">Flagged</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty Feedback / Verification Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Verified GPA, academic transcripts, and technical projects..."
                  value={reviewForm.feedbackNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedbackNotes: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Faculty Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
