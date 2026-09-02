'use client';

import React, { useState } from 'react';
import {
  Users, UserPlus, Search, Edit2, Trash2,
  Phone, Mail, X, CheckCircle2, Shield, IndianRupee, BookOpen, Calendar,
  AlertTriangle, Clock, UserCheck, Bell, ShieldAlert, MessageCircle, ArrowUpRight, DollarSign, Filter
} from 'lucide-react';
import StudentFeeModal from './StudentFeeModal';
import StudentApprovalModal from './StudentApprovalModal';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentManager({
  students = [],
  onRefresh
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending_fee' | 'overdue_fee' | 'cleared_fee' | 'pending_approval'
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

  // Partition students
  const approvedStudents = students.filter(s => s.status === 'approved' || (s.isApproved && s.status !== 'pending'));
  const pendingApprovals = students.filter(s => s.status === 'pending' || (!s.isApproved && s.status !== 'approved'));

  // Calculate Fee Categories
  const studentsWithFees = approvedStudents.map(s => ({
    ...s,
    fee: calculateStudentFee(s)
  }));

  const pendingFeeStudents = studentsWithFees.filter(s => s.fee.baseRemainingFee > 0);
  const overdueFeeStudents = studentsWithFees.filter(s => s.fee.daysOverdue > 0 && s.fee.baseRemainingFee > 0);
  const clearedFeeStudents = studentsWithFees.filter(s => s.fee.baseRemainingFee <= 0);

  const totalPendingAmount = pendingFeeStudents.reduce((acc, s) => acc + s.fee.totalRemainingPayable, 0);
  const totalOverdueAmount = overdueFeeStudents.reduce((acc, s) => acc + s.fee.totalRemainingPayable, 0);

  // Determine current list based on filter
  let currentList = [];
  if (filterTab === 'all') currentList = approvedStudents;
  else if (filterTab === 'pending_fee') currentList = pendingFeeStudents;
  else if (filterTab === 'overdue_fee') currentList = overdueFeeStudents;
  else if (filterTab === 'cleared_fee') currentList = clearedFeeStudents;
  else if (filterTab === 'pending_approval') currentList = pendingApprovals;

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
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Student & Fee Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total {approvedStudents.length} Enrolled Students &bull; {pendingFeeStudents.length} Students with Pending Fees
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

      {/* TOP KPI CARDS (Clickable Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* All Students */}
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterTab === 'all'
              ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">All Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {approvedStudents.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Enrolled batch</div>
        </button>

        {/* Pending Fee Filter Card (User's Main Request!) */}
        <button
          type="button"
          onClick={() => setFilterTab('pending_fee')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterTab === 'pending_fee'
              ? 'bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Pending Fees</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
            ₹{totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-400/90 mt-0.5 font-bold">
            {pendingFeeStudents.length} Students Pending
          </div>
        </button>

        {/* Overdue Fees */}
        <button
          type="button"
          onClick={() => setFilterTab('overdue_fee')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterTab === 'overdue_fee'
              ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Overdue Dues</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono mt-1">
            ₹{totalOverdueAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-400/90 mt-0.5 font-bold">
            {overdueFeeStudents.length} Students Overdue
          </div>
        </button>

        {/* Fees Cleared */}
        <button
          type="button"
          onClick={() => setFilterTab('cleared_fee')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterTab === 'cleared_fee'
              ? 'bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">All Cleared</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-1">
            {clearedFeeStudents.length}
          </div>
          <div className="text-[10px] text-emerald-400/90 mt-0.5">₹0 Balance Due</div>
        </button>

      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            filterTab === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Enrolled ({approvedStudents.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('pending_fee')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            filterTab === 'pending_fee'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-amber-400/80 hover:text-amber-300 border border-slate-800'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Pending Fees ({pendingFeeStudents.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('overdue_fee')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            filterTab === 'overdue_fee'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-rose-400/80 hover:text-rose-300 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue Fees ({overdueFeeStudents.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('cleared_fee')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            filterTab === 'cleared_fee'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-emerald-400/80 hover:text-emerald-300 border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Fees Cleared ({clearedFeeStudents.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('pending_approval')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap relative ${
            filterTab === 'pending_approval'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-purple-400/80 hover:text-purple-300 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Approvals ({pendingApprovals.length})</span>
          {pendingApprovals.length > 0 && (
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
            placeholder={`Search ${filterTab.replace('_', ' ')} students by name, mobile, course, roll no...`}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Student List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
            {filterTab === 'pending_fee'
              ? '🎉 Great! No students currently have pending fees.'
              : filterTab === 'overdue_fee'
              ? '✅ No overdue fee accounts at this time.'
              : filterTab === 'cleared_fee'
              ? 'No fee-cleared accounts found.'
              : filterTab === 'pending_approval'
              ? 'No pending registrations awaiting approval.'
              : 'No students match the search filter.'}
          </div>
        ) : (
          filteredStudents.map((s) => {
            const fee = calculateStudentFee(s);
            const isOverdue = fee.daysOverdue > 0 && fee.baseRemainingFee > 0;
            const isPaid = fee.baseRemainingFee <= 0;
            const isPending = s.status === 'pending' || !s.isApproved;

            const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
            const dueDateFormatted = s.dueDate
              ? new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Immediate';

            const rawWhatsAppText = isOverdue
              ? `Hello ${s.name},\n\n⚠️ *URGENT OVERDUE NOTICE - SSSAM ACADEMY*\n\nThis is to notify you that your fee installment for *${s.course || 'your course'}* is *${fee.daysOverdue} days overdue* (Scheduled Due Date: ${dueDateFormatted}).\n\n📊 *Fee & Fine Breakdown:*\n• Base Pending Fee: ₹${fee.baseRemainingFee}\n• Accrued Late Fine: +₹${fee.lateFine} (Policy: ₹150 for every 2 days overdue)\n• *Net Total Payable: ₹${fee.totalRemainingPayable}*\n\nPlease clear your overdue dues at the institute office or online immediately to avoid further fine.\n\nThank you,\n*SSSAM Academy Administration*\n📍 Ground Floor, M-24, Old DLF Colony, Sector 14, Gurugram`
              : `Hello ${s.name},\n\n🔔 *FEE PAYMENT REMINDER - SSSAM ACADEMY*\n\nThis is a friendly reminder regarding your pending fee installment of *₹${fee.baseRemainingFee}* for *${s.course || 'your course'}*.\n\n📅 *Scheduled Due Date:* ${dueDateFormatted}\n💰 *Payable Amount:* ₹${fee.totalRemainingPayable}\n\n📌 *Note on Fine Policy:* SSSAM Academy applies a late fine of *₹150 for every 2 days past the due date*. Kindly submit on or before ${dueDateFormatted} to avoid late charges.\n\nThank you,\n*SSSAM Academy Administration*\n📍 Ground Floor, M-24, Old DLF Colony, Sector 14, Gurugram`;

            const whatsappMsg = encodeURIComponent(rawWhatsAppText);

            return (
              <div
                key={s.id || s.rollNo || s.phone}
                className={`border rounded-3xl p-5 space-y-4 transition-all shadow-lg hover:shadow-xl relative overflow-hidden flex flex-col justify-between ${
                  isPending
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400'
                    : isPaid
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
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
                          : isOverdue
                          ? 'bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-600/20'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/20'
                      }`}>
                        {s.name ? s.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">
                          {s.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {s.rollNo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            &bull; {s.gender || 'Student'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      ) : isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cleared</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{fee.daysOverdue}d Overdue</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <IndianRupee className="w-3 h-3" />
                          <span>Due Pending</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course & Contact Info */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="line-clamp-1">{s.course || 'No Course Assigned'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{s.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[110px]">{s.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee Summary Box */}
                  {!isPending && (
                    <div className={`p-3 rounded-2xl border space-y-1 ${
                      isOverdue
                        ? 'bg-rose-950/40 border-rose-500/40'
                        : isPaid
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-800/80 border-slate-700/80'
                    }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Remaining Due</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Due: {s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className={`text-lg font-black font-mono ${
                          isPaid ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : 'text-amber-300'
                        }`}>
                          ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
                        </div>

                        {fee.lateFine > 0 && (
                          <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                            +₹{fee.lateFine} Fine
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isPending ? (
                    <button
                      onClick={() => setApprovalModalStudent(s)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review & Approve</span>
                    </button>
                  ) : (
                    <>
                      {/* Manage Fee Button */}
                      <button
                        onClick={() => setFeeModalStudent(s)}
                        className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          !isPaid
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>{isPaid ? 'Fee Details' : 'Collect Fee'}</span>
                      </button>

                      {/* WhatsApp Reminder (If fee is pending) */}
                      {!isPaid && cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone}?text=${whatsappMsg}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Send WhatsApp Fee Reminder"
                          className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-all flex items-center justify-center"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      {/* Edit Profile */}
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Student Info"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        title="Delete Student"
                        className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-950 text-rose-300 border border-rose-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{editingStudent ? 'Edit Student Details' : 'Add New Enrolled Student'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage student roll number, enrolled course, and fee terms.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Roll Number *</label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Enrolled Course</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. Data Science & AI, DCA, Python"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Remaining Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.remainingFee}
                    onChange={(e) => setFormData({ ...formData, remainingFee: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30"
                >
                  {loading ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Fee Management Modal */}
      {feeModalStudent && (
        <StudentFeeModal
          student={feeModalStudent}
          onClose={() => setFeeModalStudent(null)}
          onSuccess={() => {
            setFeeModalStudent(null);
            onRefresh();
          }}
        />
      )}

      {/* Student Approval Modal */}
      {approvalModalStudent && (
        <StudentApprovalModal
          student={approvalModalStudent}
          onClose={() => setApprovalModalStudent(null)}
          onSuccess={() => {
            setApprovalModalStudent(null);
            onRefresh();
          }}
        />
      )}

    </div>
  );
}
