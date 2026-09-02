'use client';

import React, { useState } from 'react';
import {
  X, BookOpen, IndianRupee, Calendar, AlertTriangle,
  CheckCircle2, ShieldCheck, RefreshCw, Sparkles, ShieldAlert
} from 'lucide-react';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentFeeModal({ student, isOpen = true, onClose, onUpdated, onSuccess }) {
  if (isOpen === false || !student) return null;

  const currentFee = calculateStudentFee(student);

  const [course, setCourse] = useState(student.course || 'Full Stack Web Development');
  const [remainingFee, setRemainingFee] = useState(student.remainingFee != null ? student.remainingFee : 5000);
  const [dueDate, setDueDate] = useState(student.dueDate || new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerSuccess = () => {
    if (onUpdated) onUpdated();
    if (onSuccess) onSuccess();
  };

  // 1. Save Course & Fee details
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const studentId = student.id || student._id || student.rollNo || student.phone;
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/fee`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          remainingFee: Number(remainingFee),
          dueDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update fee details');

      setSuccessMsg('Student course and fee details updated successfully!');
      triggerSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // 2. Settle action
  const handleSettleAction = async (action, amount = 0) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const studentId = student.id || student._id || student.rollNo || student.phone;
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to settle fee');

      setSuccessMsg(data.message || 'Fee settlement recorded!');
      triggerSuccess();
    } catch (err) {
      setError(err.message || 'Settlement failed');
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/20">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{student.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {student.rollNo}
                </span>
                <span className="text-xs text-slate-400">Course & Fee Settlement</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Snapshot Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Live Account Balance Snapshot</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              currentFee.status === 'Paid'
                ? 'bg-emerald-500/20 text-emerald-300'
                : currentFee.status === 'Overdue'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {currentFee.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
              <div className="text-[10px] text-slate-400">Base Remaining</div>
              <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">
                ₹{currentFee.baseRemainingFee}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border ${currentFee.lateFine > 0 ? 'bg-rose-950/40 border-rose-500/40' : 'bg-slate-800/70 border-slate-700/60'}`}>
              <div className="text-[10px] text-slate-400">Late Fine (₹150/2d)</div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${currentFee.lateFine > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                +₹{currentFee.lateFine}
              </div>
            </div>

            <div className="bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/40">
              <div className="text-[10px] text-blue-300 font-bold">Total Due Now</div>
              <div className="text-sm sm:text-base font-black font-mono text-blue-300 mt-0.5">
                ₹{currentFee.totalRemainingPayable}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form: Update Course, Fee & Due Date */}
        <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            1. Update Course & Fee Schedule
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400">Enrolled Course Name *</label>
            <input
              type="text"
              required
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Full Stack Web Development"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Remaining Fee (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={remainingFee}
                onChange={(e) => setRemainingFee(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Saving Details...' : 'Update Course & Fee Details'}
          </button>
        </form>

        {/* Section 2: Quick Settlement & Fine Waiver */}
        <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            2. Quick Settlement & Fine Actions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Waive Fine Button */}
            {currentFee.lateFine > 0 ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSettleAction('waiveFine')}
                className="p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-between transition-all"
              >
                <span>Waive Late Fine</span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded">₹{currentFee.lateFine}</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-500 text-center font-medium">
                No Late Fine Active
              </div>
            )}

            {/* Clear All Dues Button */}
            <button
              type="button"
              disabled={loading || currentFee.totalRemainingPayable === 0}
              onClick={() => {
                if (window.confirm(`Mark all dues cleared for ${student.name}?`)) {
                  handleSettleAction('clearAll');
                }
              }}
              className="p-3 rounded-2xl bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-between transition-all disabled:opacity-40"
            >
              <span>Mark All Paid (₹0 Due)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>

          </div>

          {/* Record Partial Payment */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter received amount (₹)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              disabled={loading || !paymentAmount || Number(paymentAmount) <= 0}
              onClick={() => {
                handleSettleAction('payAmount', Number(paymentAmount));
                setPaymentAmount('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
            >
              Deduct Payment
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
