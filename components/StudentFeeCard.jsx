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
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        {/* Course Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Course & Enrollment</div>
            <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{fee.course || 'Course Enrolled'}</span>
              {isInstallment && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
                  Inst. {student.currentInstallment || 1}/{student.totalInstallments || 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fee Quick Status & Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-zinc-400 font-medium">Remaining Fee</div>
            <div className={`text-base sm:text-lg font-black font-mono ${
              isCleared ? 'text-white' : isOverdue ? 'text-zinc-300' : 'text-white'
            }`}>
              ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-all text-xs font-semibold flex items-center gap-1"
          >
            <span>{showDetails ? 'Hide' : 'Details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3 animate-fade-in text-xs text-zinc-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block">Fee Status</span>
              <span className="font-bold inline-flex items-center gap-1 mt-0.5 text-white">
                {isCleared ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isCleared ? 'All Cleared' : isOverdue ? `${fee.daysOverdue} Days Overdue` : 'Payment Scheduled'}
              </span>
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block">Next Due Date</span>
              <span className="font-mono font-bold text-white mt-0.5 block">
                {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Due Date'}
              </span>
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block">Late Fine</span>
              <span className="font-mono font-bold mt-0.5 block text-white">
                {fee.lateFine > 0 ? `+₹${fee.lateFine} (Applied)` : '₹0'}
              </span>
            </div>
          </div>

          {/* Late fee rule notice */}
          <p className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
            ℹ️ <strong>Late Fine Policy:</strong> ₹150 fine applies for every 2 days of overdue payment beyond the scheduled due date.
          </p>
        </div>
      )}
    </div>
  );
}
