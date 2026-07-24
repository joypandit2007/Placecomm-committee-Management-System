import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  GraduationCap, 
  Mail, 
  Phone, 
  Award, 
  Sparkles, 
  Briefcase, 
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { Candidate, Job } from '../types';

interface Props {
  candidates: Candidate[];
  jobs: Job[];
  onAddCandidate: (newCandidate: Candidate) => void;
  onTriggerStudentSync: () => void;
  isSheetLinked: boolean;
}

export default function StudentDatabaseTable({
  candidates,
  jobs,
  onAddCandidate,
  onTriggerStudentSync,
  isSheetLinked
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    college: 'State Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: '2027',
    gpa: 8.5,
    skillsString: 'React, Python, SQL, Data Structures',
    notes: ''
  });

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.college.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) return;

    const parsedSkills = newStudent.skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: Candidate = {
      id: `cand-${Date.now()}`,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone || '+91 98000 00000',
      college: newStudent.college,
      degree: newStudent.degree,
      branch: newStudent.branch,
      graduationYear: newStudent.graduationYear,
      gpa: Number(newStudent.gpa) || 8.0,
      skills: parsedSkills,
      experience: [],
      projects: [],
      status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      notes: newStudent.notes || 'Manually registered in student database.'
    };

    onAddCandidate(created);
    setShowAddStudentModal(false);
    setNewStudent({
      name: '',
      email: '',
      phone: '',
      college: 'State Institute of Technology',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduationYear: '2027',
      gpa: 8.5,
      skillsString: 'React, Python, SQL, Data Structures',
      notes: ''
    });

    if (isSheetLinked) {
      onTriggerStudentSync();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="student-database-table">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Student Profiles & Resumes
          </div>
          <h2 className="text-xl font-black text-slate-900">Student Placement Records</h2>
          <p className="text-slate-400 text-xs font-light">
            View parsed resumes, GPAs, technical skills, and placement application stages. Records are recorded in the Student Google Sheet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSheetLinked && (
            <button
              onClick={onTriggerStudentSync}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2.5 px-4 rounded-xl border border-emerald-200 flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sync to Student Google Sheet</span>
            </button>
          )}

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Profile</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students by name, email, branch or college..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs hover:border-indigo-300 transition-all"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-base border border-indigo-100">
                  {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{candidate.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-light mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{candidate.degree} - {candidate.branch} ({candidate.graduationYear})</span>
                  </div>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                candidate.status === 'placed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : candidate.status === 'offered'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {candidate.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-indigo-600">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{candidate.phone}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-slate-700 font-medium">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Academic Score / GPA: <strong className="text-slate-900 font-black">{candidate.gpa} / 10</strong></span>
              </div>
            </div>

            {/* Skills Pills */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extracted Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills || []).slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Feedback Highlights if present */}
            {candidate.feedback && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-indigo-900 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  ATS AI Evaluation Highlights
                </span>
                <p className="text-indigo-800 text-[11px] font-light italic">
                  "{(candidate.feedback.strengths || [])[0] || 'High alignment with tech roles.'}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Add Student Candidate */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Add Student Record</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Das"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="rohan@college.edu"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={newStudent.degree}
                    onChange={(e) => setNewStudent({ ...newStudent, degree: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch / Major</label>
                  <input
                    type="text"
                    value={newStudent.branch}
                    onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={newStudent.graduationYear}
                    onChange={(e) => setNewStudent({ ...newStudent, graduationYear: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CGPA / GPA (out of 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStudent.gpa}
                    onChange={(e) => setNewStudent({ ...newStudent, gpa: Number(e.target.value) })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Skills (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Python, Node.js"
                  value={newStudent.skillsString}
                  onChange={(e) => setNewStudent({ ...newStudent, skillsString: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Student Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
