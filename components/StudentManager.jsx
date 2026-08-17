'use client';

import React, { useState } from 'react';
import {
  Users, UserPlus, Search, Edit2, Trash2,
  Phone, Mail, X, CheckCircle2, Shield, IndianRupee, BookOpen, Calendar,
  AlertTriangle, Clock, UserCheck, Bell, ShieldAlert
} from 'lucide-react';
import StudentFeeModal from './StudentFeeModal';
import StudentApprovalModal from './StudentApprovalModal';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentManager({
  students = [],
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeModalStudent, setFeeModalStudent] = useState(null);
  const [approvalModalStudent, setApprovalModalStudent] = useState(null);
  
  const [formData, setFormData] = useState({
    rollNo: '',
    name: '',
    course: 'Full Stack Web Development',
    remainingFee: 5000,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    phone: '',
    email: '',
    gender: 'Male',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Partition students into Approved vs Pending
  const approvedStudents = students.filter(s => s.status === 'approved' || (s.isApproved && s.status !== 'pending'));
  const pendingStudents = students.filter(s => s.status === 'pending' || (!s.isApproved && s.status !== 'approved'));

  const currentList = activeTab === 'enrolled' ? approvedStudents : pendingStudents;

  const filteredStudents = currentList.filter(s => {
    return (
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.course && s.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    const nextNum = approvedStudents.length + 101;
    setFormData({
      rollNo: `SSSAM-${nextNum}`,
      name: '',
      course: 'Full Stack Web Development',
      remainingFee: 5000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      phone: '',
      email: '',
      gender: 'Male',
      password: '123456'
    });
    setEditingStudent(null);
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      rollNo: student.rollNo,
      name: student.name,
      course: student.course || 'Full Stack Web Development',
      remainingFee: student.remainingFee != null ? student.remainingFee : 5000,
      dueDate: student.dueDate || new Date().toISOString().split('T')[0],
      phone: student.phone || '',
      email: student.email || '',
      gender: student.gender || 'Male',
      password: student.password || '123456'
    });
    setError('');
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.rollNo || !formData.name) {
      setError('Roll number and Name are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      
      onRefresh();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save student.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Student & Fee Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total {approvedStudents.length} Enrolled Students &bull; {pendingStudents.length} Pending Approval
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Enrolled Student</span>
          </button>
        </div>
      </div>

      {/* TABS: Enrolled Students vs Pending Approvals */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'enrolled'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Students ({approvedStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Approvals ({pendingStudents.length})</span>
          {pendingStudents.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'enrolled' ? 'active students' : 'pending registrations'} by name, mobile, roll no...`}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Student List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
            {activeTab === 'enrolled'
              ? 'No active students enrolled yet. Click "Add Enrolled Student" or approve registrations.'
              : 'No pending registrations awaiting approval.'}
          </div>
        ) : (
          filteredStudents.map((s) => {
            const fee = calculateStudentFee(s);
            const isOverdue = fee.daysOverdue > 0 && fee.baseRemainingFee > 0;
            const isPaid = fee.baseRemainingFee <= 0;
            const isPending = s.status === 'pending' || !s.isApproved;

            return (
              <div
                key={s.id || s.rollNo || s.phone}
                className={`border rounded-3xl p-5 space-y-4 transition-all shadow-lg hover:shadow-xl relative overflow-hidden flex flex-col justify-between ${
                  isPending
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md ${
                        isPending
                          ? 'bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-600/20'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/20'
                      }`}>
                        {s.name ? s.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">
                          {s.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>Self-Registered</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              {s.rollNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isPending && (
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                          title="Edit Student Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        className="p-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-950 text-rose-400 border border-rose-500/30 transition-all"
                        title={isPending ? 'Reject Registration' : 'Delete Student'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-slate-200">{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Course & Fee Info for Approved Students */}
                  {!isPending && (
                    <>
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          <span>Course:</span>
                        </div>
                        <div className="font-bold text-white mt-0.5 truncate">
                          {s.course || 'Full Stack Web Development'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                        isPaid
                          ? 'bg-emerald-950/30 border-emerald-500/30'
                          : isOverdue
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {s.feeType === 'installment' ? `Installment ${s.currentInstallment || 1}/${s.totalInstallments || 1}` : 'Remaining Fee'}
                          </span>
                          <span className="font-black font-mono text-sm text-white">
                            ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Due Date:</span>
                          <span className="font-mono text-slate-300">
                            {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                        </div>

                        {fee.lateFine > 0 && (
                          <div className="text-[10px] font-bold text-rose-400 flex items-center justify-between pt-1 border-t border-rose-500/20">
                            <span>Late Fine ({fee.daysOverdue}d late):</span>
                            <span className="font-mono">+₹{fee.lateFine}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="pt-3 border-t border-slate-800/80">
                  {isPending ? (
                    <button
                      onClick={() => setApprovalModalStudent(s)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Review & Approve Registration</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setFeeModalStudent(s)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Manage / Settle Fee</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Student Profile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  placeholder="e.g. SSSAM-107"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mohit Kumar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Course Enrolled *</label>
                <input
                  type="text"
                  required
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. Full Stack Web Development"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Remaining Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.remainingFee}
                    onChange={(e) => setFormData({ ...formData, remainingFee: e.target.value })}
                    placeholder="5000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Mobile Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="123456"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Student'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Admin Fee & Settlement Modal */}
      {feeModalStudent && (
        <StudentFeeModal
          student={feeModalStudent}
          isOpen={Boolean(feeModalStudent)}
          onClose={() => setFeeModalStudent(null)}
          onUpdated={() => {
            setFeeModalStudent(null);
            onRefresh();
          }}
        />
      )}

      {/* Admin Approval & Installment Modal */}
      {approvalModalStudent && (
        <StudentApprovalModal
          student={approvalModalStudent}
          isOpen={Boolean(approvalModalStudent)}
          existingCount={approvedStudents.length}
          approvedStudents={approvedStudents}
          onClose={() => setApprovalModalStudent(null)}
          onApproved={() => {
            setApprovalModalStudent(null);
            onRefresh();
          }}
        />
      )}

    </div>
  );
}
