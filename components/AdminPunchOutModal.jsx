'use client';

import React, { useState } from 'react';
import { LogOut, X, Clock, AlertCircle, CheckCircle2, User, BookOpen } from 'lucide-react';
import { formatISTTime, getIndianDateTime } from '@/lib/indianTime';

export default function AdminPunchOutModal({
  student,
  attendance,
  onClose,
  onSuccess
}) {
  const ist = getIndianDateTime();
  const currentHHMM = ist.timeStr.slice(0, 5); // e.g. "13:00"

  const [punchOutTime, setPunchOutTime] = useState(currentHHMM);
  const [remarks, setRemarks] = useState('Punched out by Admin (Student left without punch-out)');
  const [studySummary, setStudySummary] = useState('Completed class session - marked by Admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!punchOutTime) {
      setErrorMsg('Please specify a Punch Out time.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/attendance/admin-punch-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id || student._id || student.rollNo,
          date: attendance?.date || ist.dateStr,
          punchOutTime,
          remarks: remarks.trim(),
          studySummary: studySummary.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to punch out student.');
      }

      if (onSuccess) onSuccess(data.record);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error executing punch out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-all border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-md">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Admin Punch Out
            </h3>
            <p className="text-xs text-slate-400">
              Manually end study session for student
            </p>
          </div>
        </div>

        {/* Student Info Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{student.name}</div>
              <div className="text-blue-400 font-mono">{student.rollNo} • {student.course || 'Enrolled'}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Punched In At</span>
            <span className="text-emerald-400 font-mono font-bold text-xs">
              {attendance?.punchInTime ? formatISTTime(attendance.punchInTime) : '09:00 AM'}
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Punch Out Time Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Punch Out Time (IST)</span>
              <button
                type="button"
                onClick={() => setPunchOutTime(getIndianDateTime().timeStr.slice(0, 5))}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                Set Current Time ({getIndianDateTime().timeStr.slice(0, 5)})
              </button>
            </label>
            <div className="relative">
              <input
                type="time"
                value={punchOutTime}
                onChange={(e) => setPunchOutTime(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Remarks / Reason */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">
              Admin Remarks / Reason
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Student forgot to punch out before leaving"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Study Summary */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">
              Daily Study Note (Optional)
            </label>
            <textarea
              rows={2}
              value={studySummary}
              onChange={(e) => setStudySummary(e.target.value)}
              placeholder="Class topics completed..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Confirm Punch Out'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
