'use client';

import React from 'react';
import {
  BookOpen, IndianRupee, Calendar, AlertTriangle,
  CheckCircle2, Sparkles, Clock, ShieldAlert, Layers, Info, ShieldCheck
} from 'lucide-react';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentFeeCard({ student }) {
  if (!student) return null;

  const fee = calculateStudentFee(student);
  const isOverdue = fee.daysOverdue > 0 && fee.baseRemainingFee > 0;
  const isCleared = fee.baseRemainingFee <= 0;
  const isInstallment = student.feeType === 'installment' || (fee.totalInstallments && fee.totalInstallments > 1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Enrolled Course & Fee Status
            </h3>
            <div className="text-sm sm:text-base font-black text-white">
              {fee.course || 'Course Not Assigned'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstallment && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>Installment {student.currentInstallment || 1}/{student.totalInstallments || 3}</span>
            </span>
          )}

          {isCleared ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Fees Cleared</span>
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Payment Overdue</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Due Soon</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Fee Cards Grid (ONLY Remaining Fee & Due Date) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Remaining Fee Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isCleared
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : isOverdue
            ? 'bg-rose-950/25 border-rose-500/40'
            : 'bg-slate-800/80 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>{isInstallment ? `Current Installment Due (${student.currentInstallment || 1}/${student.totalInstallments || 3})` : 'Remaining Fee Payable'}</span>
            <IndianRupee className={`w-4 h-4 ${isOverdue ? 'text-rose-400' : 'text-blue-400'}`} />
          </div>

          <div className="flex items-baseline gap-2">
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              isCleared ? 'text-emerald-300' : isOverdue ? 'text-rose-300' : 'text-white'
            }`}>
              ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
            </div>

            {fee.lateFine > 0 && (
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Incl. ₹{fee.lateFine} fine
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            {isCleared
              ? 'No pending fee dues. Thank you!'
              : `Base Remaining: ₹${fee.baseRemainingFee.toLocaleString('en-IN')}`}
          </div>
        </div>

        {/* Due Date Card */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>{isInstallment ? 'Installment Due Date' : 'Fee Due Date'}</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="text-lg sm:text-xl font-black text-white font-mono">
              {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Scheduled'}
            </div>
          </div>

          <div className="text-[11px] font-medium mt-1">
            {isCleared ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Account in good standing</span>
              </span>
            ) : isOverdue ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{fee.daysOverdue} days past due date</span>
              </span>
            ) : (
              <span className="text-slate-400">Please pay on or before due date</span>
            )}
          </div>
        </div>

      </div>

      {/* Active Overdue Alert Notice (When Overdue) */}
      {isOverdue && (
        <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5 animate-fade-in shadow-lg shadow-rose-950/30">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-rose-300 text-xs sm:text-sm">
              ⚠️ Payment Overdue: Late Fine Applied (+₹{fee.lateFine})
            </div>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">
              Your fee payment is overdue by <strong>{fee.daysOverdue} days</strong>. A late fine of <strong>₹{fee.lateFine}</strong> (calculated at ₹150 for every 2 overdue days) has been added to your balance. Please contact the office admin to settle.
            </p>
          </div>
        </div>
      )}

      {/* ALWAYS VISIBLE: Important Late Fee Policy Note */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
            <span>📌 Important Fee Policy Note (Late Fine Rule):</span>
          </div>
          <p className="text-[11px] text-slate-300/90 leading-relaxed">
            All students must pay their remaining fee / installment on or before the <strong>Due Date</strong>. If payment is delayed past the due date, a <strong>Late Fine of ₹150 will be automatically added for every 2 overdue days</strong> (e.g. <em>2 Days Overdue = +₹150, 4 Days Overdue = +₹300, 6 Days Overdue = +₹450</em>).
          </p>
        </div>
      </div>

    </div>
  );
}
