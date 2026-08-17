'use client';

import React, { useState } from 'react';
import {
  BookOpen, IndianRupee, Calendar, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Layers, Info, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentFeeCard({ student }) {
  if (!student) return null;

  const fee = calculateStudentFee(student);
  const isOverdue = fee.daysOverdue > 0 && fee.baseRemainingFee > 0;
  const isCleared = fee.baseRemainingFee <= 0;
  const isInstallment = student.feeType === 'installment' || (fee.totalInstallments && fee.totalInstallments > 1);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 text-slate-900">
      
      {/* Header: Course Name & Status Badge */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Enrolled Course & Fee Status</div>
            <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{fee.course || 'Course Not Assigned'}</span>
              {isInstallment && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  Inst. {student.currentInstallment || 1}/{student.totalInstallments || 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isCleared ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-900 border border-slate-300 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
              <span>Fees Cleared</span>
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black text-white border border-black shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Payment Overdue</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>Payment Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Remaining Fee & Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Remaining Fee Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>{isInstallment ? `Current Installment (${student.currentInstallment || 1}/${student.totalInstallments || 3})` : 'Total Remaining Payable'}</span>
              <IndianRupee className="w-4 h-4 text-slate-700" />
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
              </div>

              {fee.lateFine > 0 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black text-white">
                  +₹{fee.lateFine} Fine
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-600 font-medium mt-2 pt-2 border-t border-slate-200">
            {isCleared
              ? '✅ All dues cleared. Thank you!'
              : `Base Remaining Fee: ₹${fee.baseRemainingFee.toLocaleString('en-IN')}`}
          </div>
        </div>

        {/* Due Date Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
              <span>Scheduled Due Date</span>
              <Calendar className="w-4 h-4 text-slate-700" />
            </div>

            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not Scheduled'}
            </div>
          </div>

          <div className="text-[11px] font-bold mt-2 pt-2 border-t border-slate-200">
            {isCleared ? (
              <span className="text-slate-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Account in Good Standing</span>
              </span>
            ) : isOverdue ? (
              <span className="text-slate-900 font-black flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-black" />
                <span>{fee.daysOverdue} Days Past Due Date</span>
              </span>
            ) : (
              <span className="text-slate-600">Please pay on or before due date</span>
            )}
          </div>
        </div>

      </div>

      {/* Active Overdue Live Calculation Breakdown (When Overdue) */}
      {isOverdue && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-2.5 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-black flex-shrink-0" />
            <span>⚠️ Overdue Fine Calculation Breakdown:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-semibold">Base Fee</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">₹{fee.baseRemainingFee}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-semibold">Days Overdue</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{fee.daysOverdue} Days</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-semibold">Fine Applied</span>
              <span className="font-mono font-bold text-black text-sm mt-0.5 block">+₹{fee.lateFine}</span>
            </div>
            <div className="bg-black text-white p-2.5 rounded-xl border border-black">
              <span className="text-[10px] text-slate-300 block font-semibold">Total Payable</span>
              <span className="font-mono font-bold text-white text-sm mt-0.5 block">₹{fee.totalRemainingPayable}</span>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LATE FINE POLICY & SLAB TABLE (ALWAYS VISIBLE) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
            📌 Important Late Fee Policy & Rules
          </h4>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          All students are required to pay their remaining course fee or monthly installment on or before the scheduled <strong>Due Date</strong>. If payment is delayed past the due date, a <strong>Late Fine of ₹150 is automatically added for every 2 overdue days</strong>:
        </p>

        {/* Slab Example Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">1 - 2 Days Overdue</span>
            <span className="font-mono font-black text-slate-900 mt-0.5 block">+₹150 Fine</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">3 - 4 Days Overdue</span>
            <span className="font-mono font-black text-slate-900 mt-0.5 block">+₹300 Fine</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">5 - 6 Days Overdue</span>
            <span className="font-mono font-black text-slate-900 mt-0.5 block">+₹450 Fine</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">7 - 8 Days Overdue</span>
            <span className="font-mono font-black text-slate-900 mt-0.5 block">+₹600 Fine</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium pt-1">
          💡 <em>Note: To avoid accumulating late fines, please complete your payment on or before the due date or visit the institute office.</em>
        </div>

      </div>

    </div>
  );
}
