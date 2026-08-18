'use client';

import React, { useState } from 'react';
import {
  X, CheckCircle2, ShieldCheck, UserCheck, BookOpen,
  IndianRupee, Calendar, Layers, AlertTriangle, UserX, Clock
} from 'lucide-react';

export default function StudentApprovalModal({
  student,
  isOpen,
  onClose,
  onApproved,
  existingCount = 0,
  approvedStudents = []
}) {
  if (!isOpen || !student) return null;

  // Calculate highest existing roll number
  const maxRollNum = (approvedStudents || []).reduce((max, s) => {
    const match = s.rollNo && s.rollNo.match(/SSSAM-(\d+)/i);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 100);
  const defaultRollNo = `SSSAM-${Math.max(maxRollNum + 1, existingCount + 101)}`;

  const [rollNo, setRollNo] = useState(
    student.rollNo && !student.rollNo.startsWith('TEMP') ? student.rollNo : defaultRollNo
  );
  const [course, setCourse] = useState(student.course && student.course !== 'Not Assigned Yet' ? student.course : 'Full Stack Web Development');
  const [feeType, setFeeType] = useState('single'); // 'single' | 'installment'

  // Single payment state
  const [singleFee, setSingleFee] = useState(5000);
  const [singleDueDate, setSingleDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Installment plan state
  const [totalCourseFee, setTotalCourseFee] = useState(15000);
  const [numInstallments, setNumInstallments] = useState(3);
  const [installments, setInstallments] = useState([
    { installmentNo: 1, amount: 5000, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { installmentNo: 2, amount: 5000, dueDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { installmentNo: 3, amount: 5000, dueDate: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Re-generate installments when total fee or count changes
  const handleGenerateInstallments = (total, count) => {
    const splitAmount = Math.round(total / count);
    const newArr = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date();
      d.setDate(d.getDate() + 7 + (i - 1) * 30);
      newArr.push({
        installmentNo: i,
        amount: splitAmount,
        dueDate: d.toISOString().split('T')[0]
      });
    }
    setInstallments(newArr);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!rollNo.trim() || !course.trim()) {
      setError('Roll number and Course Name are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const remainingFee = feeType === 'installment'
        ? Number(installments[0]?.amount || Math.round(totalCourseFee / numInstallments))
        : Number(singleFee);

      const dueDate = feeType === 'installment'
        ? (installments[0]?.dueDate || singleDueDate)
        : singleDueDate;

      const payload = {
        rollNo: rollNo.trim().toUpperCase(),
        course: course.trim(),
        phone: student.phone,
        email: student.email,
        name: student.name,
        feeType,
        remainingFee,
        dueDate,
        installments: feeType === 'installment' ? installments : [],
        totalInstallments: feeType === 'installment' ? numInstallments : 1
      };

      const res = await fetch(`/api/students/${student.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed');

      if (onApproved) onApproved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to approve student.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Are you sure you want to reject and remove registration for ${student.name}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reject registration');
      if (onApproved) onApproved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Review & Approve Registration</h3>
              <p className="text-xs text-slate-400">
                Assign Roll Number, Course, and Fee Plan to activate account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white text-sm">{student.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Pending Approval</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
            <div>Mobile: <strong className="text-white font-mono">{student.phone}</strong></div>
            <div>Email: <strong className="text-white truncate block">{student.email}</strong></div>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Approval Form */}
        <form onSubmit={handleApprove} className="space-y-4 text-xs">
          
          {/* Section 1: Roll No & Course */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Assign Roll Number & Course
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. SSSAM-101"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Course Name *</label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Full Stack Web Development"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fee Payment Plan (Single vs Installment) */}
          <div className="border-t border-slate-800 pt-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Fee Payment Plan (Installments / One-Time)
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFeeType('single')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    feeType === 'single'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  One-Time
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeeType('installment');
                    handleGenerateInstallments(totalCourseFee, numInstallments);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    feeType === 'installment'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Installments Plan
                </button>
              </div>
            </div>

            {/* SINGLE PAYMENT INPUTS */}
            {feeType === 'single' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 animate-fade-in">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Remaining Fee Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={singleFee}
                    onChange={(e) => setSingleFee(e.target.value)}
                    placeholder="5000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Fee Due Date *</label>
                  <input
                    type="date"
                    required
                    value={singleDueDate}
                    onChange={(e) => setSingleDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* INSTALLMENT PAYMENT INPUTS */}
            {feeType === 'installment' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Total Course Fee (₹)</label>
                    <input
                      type="number"
                      value={totalCourseFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTotalCourseFee(val);
                        handleGenerateInstallments(val, numInstallments);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">No. of Installments</label>
                    <select
                      value={numInstallments}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNumInstallments(val);
                        handleGenerateInstallments(totalCourseFee, val);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="2">2 Installments</option>
                      <option value="3">3 Installments</option>
                      <option value="4">4 Installments</option>
                      <option value="6">6 Installments</option>
                    </select>
                  </div>
                </div>

                {/* Installment Breakdown List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Installment Schedule Breakdown:
                  </span>
                  {installments.map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                      <span className="font-bold text-emerald-400 min-w-[90px]">
                        Installment #{inst.installmentNo}:
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={inst.amount}
                          onChange={(e) => {
                            const newArr = [...installments];
                            newArr[idx].amount = Number(e.target.value);
                            setInstallments(newArr);
                          }}
                          className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                        />
                        <span className="text-slate-400">Due:</span>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const newArr = [...installments];
                            newArr[idx].dueDate = e.target.value;
                            setInstallments(newArr);
                          }}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={loading}
              onClick={handleReject}
              className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-950 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <UserX className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Activating Account...' : 'Approve & Activate Account'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
