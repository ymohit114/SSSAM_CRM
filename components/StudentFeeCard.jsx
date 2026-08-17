'use client';

import React, { useState } from 'react';
import {
  BookOpen, IndianRupee, Calendar, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Layers, Info, ShieldCheck
} from 'lucide-react';
import { calculateStudentFee } from '@/lib/feeHelper';

export default function StudentFeeCard({ student }) {
  const [showDetails, setShowDetails] = useState(false);
  if (!student) return null;

  const fee = calculateStudentFee(student);
  const isOverdue = fee.daysOverdue > 0 && fee.baseRemainingFee > 0;
  const isCleared = fee.baseRemainingFee <= 0;
  const isInstallment = student.feeType === 'installment' || (fee.totalInstallments && fee.totalInstallments > 1);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        {/* Course Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Course & Enrollment</div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{fee.course || 'Course Enrolled'}</span>
              {isInstallment && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Inst. {student.currentInstallment || 1}/{student.totalInstallments || 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fee Quick Status & Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Remaining Fee</div>
            <div className={`text-base sm:text-lg font-black font-mono ${
              isCleared ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : 'text-white'
            }`}>
              ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1"
          >
            <span>{showDetails ? 'Hide' : 'Details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-fade-in text-xs text-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Fee Status</span>
              <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
                isCleared ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isCleared ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isCleared ? 'All Cleared' : isOverdue ? `${fee.daysOverdue} Days Overdue` : 'Payment Scheduled'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Next Due Date</span>
              <span className="font-mono font-bold text-white mt-0.5 block">
                {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Due Date'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Late Fine</span>
              <span className={`font-mono font-bold mt-0.5 block ${fee.lateFine > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {fee.lateFine > 0 ? `+₹${fee.lateFine} (Applied)` : '₹0'}
              </span>
            </div>
          </div>

          {/* Late fee rule notice */}
          <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
            ℹ️ <strong>Late Fine Policy:</strong> ₹150 fine applies for every 2 days of overdue payment beyond the scheduled due date.
          </p>
        </div>
      )}
    </div>
  );
}
