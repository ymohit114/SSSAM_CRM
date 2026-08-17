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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm backdrop-blur-md transition-all text-slate-900">
      <div className="flex items-center justify-between flex-wrap gap-3">
        
        {/* Course Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-900 font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Course & Enrollment</div>
            <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{fee.course || 'Course Enrolled'}</span>
              {isInstallment && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  Inst. {student.currentInstallment || 1}/{student.totalInstallments || 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fee Quick Status & Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium">Remaining Fee</div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900">
              ₹{fee.totalRemainingPayable.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black border border-slate-300 transition-all text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <span>{showDetails ? 'Hide' : 'Details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Details Section */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fade-in text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Fee Status</span>
              <span className="font-bold inline-flex items-center gap-1 mt-0.5 text-slate-900">
                {isCleared ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                {isCleared ? 'All Cleared' : isOverdue ? `${fee.daysOverdue} Days Overdue` : 'Payment Scheduled'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Next Due Date</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Due Date'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Late Fine</span>
              <span className="font-mono font-bold mt-0.5 block text-slate-900">
                {fee.lateFine > 0 ? `+₹${fee.lateFine} (Applied)` : '₹0'}
              </span>
            </div>
          </div>

          {/* Late fee rule notice */}
          <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            ℹ️ <strong>Late Fine Policy:</strong> ₹150 fine applies for every 2 days of overdue payment beyond the scheduled due date.
          </p>
        </div>
      )}
    </div>
  );
}
