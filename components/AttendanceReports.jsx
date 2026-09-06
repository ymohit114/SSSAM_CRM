'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Printer, Filter, Calendar,
  Search, Users, Clock, MapPin, CheckCircle2, IndianRupee,
  AlertTriangle, ArrowUpRight, MessageCircle, BookOpen, Layers,
  RotateCcw, Eye, X, Trash2
} from 'lucide-react';
import { formatISTTime, getIndianDateTime } from '@/lib/indianTime';
import { calculateStudentFee } from '@/lib/feeHelper';
import { fetchWithAuth } from '@/lib/apiClient';

export default function AttendanceReports({
  institute,
  students = []
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Primary Mode: 'fees' | 'attendance'
  const [reportType, setReportType] = useState('fees');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reportGeneratedTime, setReportGeneratedTime] = useState('');
  const [reportGeneratedDate, setReportGeneratedDate] = useState(todayStr);

  // Attendance Filter States
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedAttendanceStudent, setSelectedAttendanceStudent] = useState('');
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fee Filter States
  const [feeCategoryFilter, setFeeCategoryFilter] = useState('all_pending'); // 'all_pending' | 'overdue' | 'within_5_days' | 'within_10_days' | 'custom_dates' | 'cleared' | 'all'
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [feeCourseFilter, setFeeCourseFilter] = useState('all');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const d = getIndianDateTime();
    setReportGeneratedDate(d.dateStr);
    setReportGeneratedTime(formatISTTime(d.timeStr));
  }, []);

  // Fetch Attendance History
  const fetchAttendanceReports = async () => {
    try {
      setLoadingLogs(true);
      const query = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedAttendanceStudent ? { studentId: selectedAttendanceStudent } : {}),
        status: selectedAttendanceStatus
      }).toString();

      const res = await fetchWithAuth(`/api/attendance/history?${query}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteLog = async (logId, studentName, date) => {
    if (!window.confirm(`Are you sure you want to delete the attendance log for "${studentName}" on ${date}?`)) {
      return;
    }

    try {
      setDeletingId(logId);
      const res = await fetchWithAuth(`/api/attendance/history?id=${encodeURIComponent(logId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete attendance log');

      setLogs(prev => prev.filter(l => (l.id || l._id) !== logId));
    } catch (err) {
      alert(err.message || 'Error deleting attendance log');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFilteredLogs = async () => {
    if (logs.length === 0) return;
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete all ${logs.length} filtered attendance records? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoadingLogs(true);
      const query = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedAttendanceStudent ? { studentId: selectedAttendanceStudent } : {})
      }).toString();

      const res = await fetchWithAuth(`/api/attendance/history?${query}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clear attendance logs');

      setLogs([]);
      alert(`Successfully deleted ${data.deletedCount || logs.length} attendance records.`);
    } catch (err) {
      alert(err.message || 'Error deleting attendance logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (reportType === 'attendance') {
      fetchAttendanceReports();
    }
  }, [reportType, startDate, endDate, selectedAttendanceStudent, selectedAttendanceStatus]);

  // ==========================================================
  // PROCESS FEE DATA FOR STUDENTS
  // ==========================================================
  const approvedStudents = students.filter(s => s.status === 'approved' || (s.isApproved && s.status !== 'pending'));
  const allCourses = Array.from(new Set(approvedStudents.map(s => s.course).filter(Boolean)));

  const processedFeeStudents = approvedStudents.map(s => {
    const fee = calculateStudentFee(s);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysDifference = null;
    let timelineStatus = 'No Due Date';
    let timelineBadgeColor = 'slate';

    if (s.dueDate) {
      const due = new Date(s.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffMs = due - today;
      daysDifference = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (daysDifference < 0) {
        timelineStatus = `${Math.abs(daysDifference)} Days Overdue`;
        timelineBadgeColor = 'rose';
      } else if (daysDifference === 0) {
        timelineStatus = 'Due Today';
        timelineBadgeColor = 'amber';
      } else if (daysDifference <= 5) {
        timelineStatus = `Due in ${daysDifference} Days`;
        timelineBadgeColor = 'amber';
      } else if (daysDifference <= 10) {
        timelineStatus = `Due in ${daysDifference} Days`;
        timelineBadgeColor = 'blue';
      } else {
        timelineStatus = `Due in ${daysDifference} Days`;
        timelineBadgeColor = 'slate';
      }
    }

    if (fee.baseRemainingFee <= 0) {
      timelineStatus = 'Cleared (₹0 Due)';
      timelineBadgeColor = 'emerald';
    }

    return {
      ...s,
      fee,
      daysDifference,
      timelineStatus,
      timelineBadgeColor
    };
  });

  // Filter Fee Students according to user selection
  const filteredFeeStudents = processedFeeStudents.filter(s => {
    // 1. Course Filter
    if (feeCourseFilter !== 'all' && s.course !== feeCourseFilter) return false;

    // 2. Category Filter
    const hasRemaining = s.fee.baseRemainingFee > 0;
    const isOverdue = s.daysDifference !== null && s.daysDifference < 0 && hasRemaining;
    const isWithin5 = s.daysDifference !== null && s.daysDifference >= 0 && s.daysDifference <= 5 && hasRemaining;
    const isWithin10 = s.daysDifference !== null && s.daysDifference >= 0 && s.daysDifference <= 10 && hasRemaining;
    const isCleared = s.fee.baseRemainingFee <= 0;

    if (feeCategoryFilter === 'all_pending' && !hasRemaining) return false;
    if (feeCategoryFilter === 'overdue' && !isOverdue) return false;
    if (feeCategoryFilter === 'within_5_days' && !isWithin5) return false;
    if (feeCategoryFilter === 'within_10_days' && !isWithin10) return false;
    if (feeCategoryFilter === 'cleared' && !isCleared) return false;

    // 3. Due Date Range Filter
    if (dueDateFrom && s.dueDate && s.dueDate < dueDateFrom) return false;
    if (dueDateTo && s.dueDate && s.dueDate > dueDateTo) return false;

    // 4. Search Query
    if (feeSearchQuery) {
      const q = feeSearchQuery.toLowerCase();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.rollNo && s.rollNo.toLowerCase().includes(q);
      const matchPhone = s.phone && s.phone.includes(q);
      const matchCourse = s.course && s.course.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchPhone && !matchCourse) return false;
    }

    return true;
  });

  // Helper for quick date presets
  const applyDatePreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      setDueDateFrom(todayStr);
      setDueDateTo(todayStr);
    } else if (preset === 'this_week') {
      const startOfWeek = new Date(today);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      setDueDateFrom(startOfWeek.toISOString().split('T')[0]);
      setDueDateTo(endOfWeek.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDueDateFrom(startOfMonth.toISOString().split('T')[0]);
      setDueDateTo(endOfMonth.toISOString().split('T')[0]);
    } else if (preset === 'next_month') {
      const startOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      setDueDateFrom(startOfNext.toISOString().split('T')[0]);
      setDueDateTo(endOfNext.toISOString().split('T')[0]);
    } else if (preset === 'clear') {
      setDueDateFrom('');
      setDueDateTo('');
    }
  };

  // KPI Summary for Fees
  const totalRemainingBase = filteredFeeStudents.reduce((acc, s) => acc + s.fee.baseRemainingFee, 0);
  const totalAccruedFine = filteredFeeStudents.reduce((acc, s) => acc + s.fee.lateFine, 0);
  const totalNetPayable = filteredFeeStudents.reduce((acc, s) => acc + s.fee.totalRemainingPayable, 0);

  // ==========================================================
  // EXPORT HANDLERS
  // ==========================================================
  const handleExportAttendanceCSV = () => {
    if (logs.length === 0) {
      alert('No attendance records to export.');
      return;
    }

    const headers = [
      'Date', 'Roll Number', 'Student Name', 'Punch In Time', 'Punch Out Time',
      'Duration (Minutes)', 'Daily Study Log', 'GPS Distance (meters)', 'Status', 'Remarks'
    ];

    const rows = logs.map(l => [
      l.date,
      `"${l.rollNo}"`,
      `"${l.studentName}"`,
      l.punchInTime || '',
      l.punchOutTime || '',
      l.durationMinutes || 0,
      `"${(l.studySummary || '').replace(/"/g, '""')}"`,
      l.punchInDistance != null ? Math.round(l.punchInDistance) : '',
      l.status,
      `"${l.remarks || ''}"`
    ]);

    downloadCSV(headers, rows, `SSSAM_Attendance_Report_${startDate}_to_${endDate}.csv`);
  };

  const handleExportFeeCSV = () => {
    if (filteredFeeStudents.length === 0) {
      alert('No student fee records to export for the selected filter.');
      return;
    }

    const headers = [
      'Roll Number', 'Student Name', 'Mobile Number', 'Email', 'Enrolled Course',
      'Fee Plan', 'Total Course Fee (₹)', 'Paid Amount (₹)', 'Base Remaining Fee (₹)',
      'Due Date', 'Days / Due Status', 'Accrued Late Fine (₹)', 'Net Total Payable (₹)', 'Payment Status'
    ];

    const rows = filteredFeeStudents.map(s => [
      `"${s.rollNo}"`,
      `"${s.name}"`,
      `"${s.phone || 'N/A'}"`,
      `"${s.email || 'N/A'}"`,
      `"${s.course || 'N/A'}"`,
      `"${s.feeType || 'single'}"`,
      s.totalCourseFee || (s.fee.baseRemainingFee + (s.paidAmount || 0)),
      s.paidAmount || 0,
      s.fee.baseRemainingFee,
      s.dueDate || 'N/A',
      `"${s.timelineStatus}"`,
      s.fee.lateFine,
      s.fee.totalRemainingPayable,
      s.fee.baseRemainingFee <= 0 ? 'Paid / Cleared' : (s.fee.daysOverdue > 0 ? 'Overdue' : 'Pending')
    ]);

    const dateScope = dueDateFrom || dueDateTo ? `_${dueDateFrom || 'Start'}_to_${dueDateTo || 'End'}` : '';
    const filterName = feeCategoryFilter.toUpperCase();
    downloadCSV(headers, rows, `SSSAM_Academy_Pending_Fees_${filterName}${dateScope}_${todayStr}.csv`);
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header (Web View) */}
      <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Reports & Data Export</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Filter, analyze, and export student attendance logs & pending fee reports in Excel spreadsheet format.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPrintPreview(!showPrintPreview)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-2xl text-xs font-bold border border-indigo-500/40 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>{showPrintPreview ? 'Close Excel View' : 'Excel Sheet View'}</span>
          </button>

          <button
            onClick={reportType === 'fees' ? handleExportFeeCSV : handleExportAttendanceCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR (Pending Fees vs Attendance) */}
      <div className="print-hide flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setReportType('fees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            reportType === 'fees'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Pending Fees & Dues Report</span>
        </button>

        <button
          onClick={() => setReportType('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            reportType === 'attendance'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance Logs & Study History</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PENDING FEES & DUES EXPORT */}
      {/* ========================================================================= */}
      {reportType === 'fees' && (
        <div className="space-y-5">
          
          {/* Quick Filter Cards */}
          <div className="print-hide grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* All Pending */}
            <button
              type="button"
              onClick={() => { setFeeCategoryFilter('all_pending'); applyDatePreset('clear'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                feeCategoryFilter === 'all_pending' && !dueDateFrom && !dueDateTo
                  ? 'bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">All Pending Fees</span>
                <IndianRupee className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-300 font-mono mt-1">
                {processedFeeStudents.filter(s => s.fee.baseRemainingFee > 0).length} Students
              </div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Total active dues</div>
            </button>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => { setFeeCategoryFilter('overdue'); applyDatePreset('clear'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                feeCategoryFilter === 'overdue'
                  ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">⚠️ Overdue</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-rose-300 font-mono mt-1">
                {processedFeeStudents.filter(s => s.daysDifference !== null && s.daysDifference < 0 && s.fee.baseRemainingFee > 0).length} Students
              </div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Past due date (+Late Fine)</div>
            </button>

            {/* Within 5 Days */}
            <button
              type="button"
              onClick={() => { setFeeCategoryFilter('within_5_days'); applyDatePreset('clear'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                feeCategoryFilter === 'within_5_days'
                  ? 'bg-orange-950/70 border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-orange-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-orange-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">⏳ Within 5 Days</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-orange-300 font-mono mt-1">
                {processedFeeStudents.filter(s => s.daysDifference !== null && s.daysDifference >= 0 && s.daysDifference <= 5 && s.fee.baseRemainingFee > 0).length} Students
              </div>
              <div className="text-[10px] text-orange-400/80 mt-0.5">Due in next 1 to 5 days</div>
            </button>

            {/* Within 10 Days */}
            <button
              type="button"
              onClick={() => { setFeeCategoryFilter('within_10_days'); applyDatePreset('clear'); }}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                feeCategoryFilter === 'within_10_days'
                  ? 'bg-blue-950/70 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">📅 Within 10 Days</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-xl font-black text-blue-300 font-mono mt-1">
                {processedFeeStudents.filter(s => s.daysDifference !== null && s.daysDifference >= 0 && s.daysDifference <= 10 && s.fee.baseRemainingFee > 0).length} Students
              </div>
              <div className="text-[10px] text-blue-400/80 mt-0.5">Due in next 1 to 10 days</div>
            </button>

          </div>

          {/* Detailed Filter Toolbar (Web View) */}
          <div className="print-hide bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <span>FILTER BY TIMELINE, EXACT DATES & COURSE</span>
              </div>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 uppercase">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyDatePreset('this_week')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold border border-slate-700"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('this_month')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold border border-slate-700"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('next_month')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold border border-slate-700"
                >
                  Next Month
                </button>
                {(dueDateFrom || dueDateTo) && (
                  <button
                    type="button"
                    onClick={() => applyDatePreset('clear')}
                    className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-[10px] text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Dates</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Category Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Timeline Preset</label>
                <select
                  value={feeCategoryFilter}
                  onChange={(e) => setFeeCategoryFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all_pending">💰 All Pending Fees</option>
                  <option value="overdue">⚠️ Overdue Dues (Past Due Date)</option>
                  <option value="within_5_days">⏳ Due Within 5 Days</option>
                  <option value="within_10_days">📅 Due Within 10 Days</option>
                  <option value="cleared">✅ All Cleared (₹0 Due)</option>
                  <option value="all">👥 All Enrolled Students</option>
                </select>
              </div>

              {/* Due Date From */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due Date From</span>
                </label>
                <input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Due Date To */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due Date To</span>
                </label>
                <input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Course Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Course</label>
                <select
                  value={feeCourseFilter}
                  onChange={(e) => setFeeCourseFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Courses ({allCourses.length})</option>
                  {allCourses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feeSearchQuery}
                    onChange={(e) => setFeeSearchQuery(e.target.value)}
                    placeholder="Name, roll, phone..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

            </div>

            {/* Financial Summary */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Base Remaining Due</span>
                  <span className="text-amber-400 font-mono font-black text-sm">
                    ₹{totalRemainingBase.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Late Fine Total</span>
                  <span className="text-rose-400 font-mono font-bold text-sm">
                    +₹{totalAccruedFine.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Net Total Receivable</span>
                  <span className="text-emerald-400 font-mono font-black text-base">
                    ₹{totalNetPayable.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Matching Records</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {filteredFeeStudents.length} Students
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* EXCEL SHEET FORMATTED PRINTABLE DOCUMENT (Visible on Print / Preview) */}
          {/* ========================================================================= */}
          <div className={`${showPrintPreview ? 'block' : 'hidden print:block'} print-container bg-white text-black p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-2xl space-y-6`}>
            
            {/* Institute Header */}
            <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black uppercase">
                  SSSAM ACADEMY
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Ground Floor, M-24, Old DLF Colony, Sector 14, Gurugram, Haryana 122001 &bull; Contact: +91 98765 43210
                </p>
                <div className="inline-block px-3 py-1 bg-black text-white font-black text-xs uppercase tracking-wider rounded mt-1">
                  OFFICIAL STUDENT PENDING DUES & RECOVERY STATEMENT
                </div>
              </div>

              <div className="text-center sm:text-right text-xs space-y-1 font-mono text-slate-800" suppressHydrationWarning>
                <div><strong>Date Generated:</strong> {mounted ? reportGeneratedDate : todayStr}</div>
                <div><strong>Time:</strong> {mounted ? reportGeneratedTime : '--:--'} (IST)</div>
                <div><strong>Report Scope:</strong> {feeCategoryFilter.toUpperCase().replace(/_/g, ' ')}</div>
                {dueDateFrom || dueDateTo ? (
                  <div><strong>Date Range:</strong> {dueDateFrom || 'Start'} to {dueDateTo || 'End'}</div>
                ) : null}
              </div>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-4 gap-2 border border-black bg-slate-100 p-3 text-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Filtered Students</span>
                <span className="text-base font-black font-mono text-black">{filteredFeeStudents.length}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Base Dues</span>
                <span className="text-base font-black font-mono text-black">₹{totalRemainingBase.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Accrued Late Fine</span>
                <span className="text-base font-bold font-mono text-red-600">+₹{totalAccruedFine.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Net Total Receivable</span>
                <span className="text-base font-black font-mono text-black">₹{totalNetPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Formal Excel Table */}
            <div className="overflow-x-auto">
              <table className="excel-table w-full text-left text-xs border border-black">
                <thead>
                  <tr className="bg-slate-200 text-black border-b border-black text-[10px] font-black uppercase">
                    <th className="py-2 px-2.5 text-center border border-black w-10">S.No</th>
                    <th className="py-2 px-2.5 border border-black">Roll No</th>
                    <th className="py-2 px-2.5 border border-black">Student Name</th>
                    <th className="py-2 px-2.5 border border-black">Mobile</th>
                    <th className="py-2 px-2.5 border border-black">Course Enrolled</th>
                    <th className="py-2 px-2.5 text-center border border-black">Due Date</th>
                    <th className="py-2 px-2.5 text-center border border-black">Due Status</th>
                    <th className="py-2 px-2.5 text-right border border-black">Base Fee (₹)</th>
                    <th className="py-2 px-2.5 text-right border border-black">Late Fine (₹)</th>
                    <th className="py-2 px-2.5 text-right border border-black">Net Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-black">
                  {filteredFeeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-500 font-semibold border border-black">
                        No students with pending dues match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFeeStudents.map((s, idx) => (
                      <tr key={s.id || s.rollNo} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-2 px-2 text-center font-mono font-bold border border-black">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-mono font-bold border border-black">{s.rollNo}</td>
                        <td className="py-2 px-2.5 font-bold border border-black">{s.name}</td>
                        <td className="py-2 px-2.5 font-mono border border-black">{s.phone || 'N/A'}</td>
                        <td className="py-2 px-2.5 border border-black">{s.course || 'N/A'}</td>
                        <td className="py-2 px-2.5 text-center font-mono border border-black">
                          {s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="py-2 px-2.5 text-center font-semibold border border-black">
                          {s.timelineStatus}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-semibold border border-black">
                          ₹{s.fee.baseRemainingFee.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-red-600 border border-black">
                          {s.fee.lateFine > 0 ? `+₹${s.fee.lateFine}` : '₹0'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-black border border-black">
                          ₹{s.fee.totalRemainingPayable.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Table Footer Grand Totals */}
                  {filteredFeeStudents.length > 0 && (
                    <tr className="bg-slate-200 font-black border-t-2 border-black text-black">
                      <td colSpan={7} className="py-2.5 px-3 text-right uppercase tracking-wider border border-black">
                        GRAND TOTAL PAYABLE:
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono border border-black">
                        ₹{totalRemainingBase.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-red-600 border border-black">
                        +₹{totalAccruedFine.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-base border border-black font-black">
                        ₹{totalNetPayable.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SSSAM Late Fine Policy Note */}
            <div className="border border-black p-3.5 bg-slate-50 text-xs space-y-1 text-slate-800">
              <div className="font-bold text-black uppercase tracking-wider text-[11px]">
                📌 SSSAM Academy Late Fine & Recovery Policy Notice:
              </div>
              <p>
                • As per academy terms, a late fine slab of <strong>+₹150 is accumulated for every 2 calendar days past the scheduled due date</strong> (e.g. 1-2 Days = ₹150, 3-4 Days = ₹300, 5-6 Days = ₹450, 7-8 Days = ₹600).
              </p>
              <p>
                • All students listed above must clear their dues at the institute reception desk or via official portal UPI/Netbanking.
              </p>
            </div>

            {/* Signatures & Verification */}
            <div className="pt-8 flex items-end justify-between text-xs text-black border-t border-slate-300">
              <div className="space-y-1">
                <div><strong>Prepared By:</strong> Mohit Yadav (Admin / Director)</div>
                <div><strong>System:</strong> SSSAM Portal Automated Billing Engine</div>
              </div>
              <div className="text-right space-y-8">
                <div className="w-48 border-b border-black"></div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Authorized Signatory & Seal</div>
              </div>
            </div>

          </div>

          {/* Interactive Web Table (For on-screen review) */}
          <div className="print-hide bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Timeline Status</th>
                    <th className="py-3 px-4 text-right">Base Due</th>
                    <th className="py-3 px-4 text-right">Late Fine</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredFeeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        No students match the selected date range & fee criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredFeeStudents.map((s) => {
                      const cleanPhone = (s.phone || '').replace(/[^0-9]/g, '');
                      const isOverdue = s.fee.daysOverdue > 0 && s.fee.baseRemainingFee > 0;
                      const dueDateFormatted = s.dueDate
                        ? new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Immediate';

                      const rawWhatsAppText = isOverdue
                        ? `Hello ${s.name},\n\n⚠️ *URGENT OVERDUE NOTICE - SSSAM ACADEMY*\n\nThis is to notify you that your fee installment for *${s.course || 'your course'}* is *${s.fee.daysOverdue} days overdue* (Scheduled Due Date: ${dueDateFormatted}).\n\n📊 *Fee & Fine Breakdown:*\n• Base Pending Fee: ₹${s.fee.baseRemainingFee}\n• Accrued Late Fine: +₹${s.fee.lateFine} (Policy: ₹150 for every 2 days overdue)\n• *Net Total Payable: ₹${s.fee.totalRemainingPayable}*\n\nPlease clear your overdue dues at the institute office or online immediately to avoid further fine.\n\nThank you,\n*SSSAM Academy Administration*\n📍 Ground Floor, M-24, Old DLF Colony, Sector 14, Gurugram`
                        : `Hello ${s.name},\n\n🔔 *FEE PAYMENT REMINDER - SSSAM ACADEMY*\n\nThis is a friendly reminder regarding your pending fee installment of *₹${s.fee.baseRemainingFee}* for *${s.course || 'your course'}*.\n\n📅 *Scheduled Due Date:* ${dueDateFormatted}\n💰 *Payable Amount:* ₹${s.fee.totalRemainingPayable}\n\n📌 *Note on Fine Policy:* SSSAM Academy applies a late fine of *₹150 for every 2 days past the due date*. Kindly submit on or before ${dueDateFormatted} to avoid late charges.\n\nThank you,\n*SSSAM Academy Administration*\n📍 Ground Floor, M-24, Old DLF Colony, Sector 14, Gurugram`;

                      const whatsappMsg = encodeURIComponent(rawWhatsAppText);

                      return (
                        <tr key={s.id || s.rollNo} className="hover:bg-slate-800/40 transition-colors">
                          
                          {/* Student */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{s.name}</div>
                            <div className="text-[10px] font-mono text-blue-400">{s.rollNo}</div>
                          </td>

                          {/* Course */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-200">{s.course || 'N/A'}</span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            <div>{s.phone || 'N/A'}</div>
                          </td>

                          {/* Due Date */}
                          <td className="py-3 px-4 font-mono text-xs text-slate-300">
                            {s.dueDate ? new Date(s.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>

                          {/* Timeline Status Badge */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              s.timelineBadgeColor === 'rose'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : s.timelineBadgeColor === 'amber'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : s.timelineBadgeColor === 'blue'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : s.timelineBadgeColor === 'emerald'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {s.timelineStatus}
                            </span>
                          </td>

                          {/* Base Due */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                            ₹{s.fee.baseRemainingFee.toLocaleString('en-IN')}
                          </td>

                          {/* Late Fine */}
                          <td className="py-3 px-4 text-right font-mono text-rose-400">
                            {s.fee.lateFine > 0 ? `+₹${s.fee.lateFine}` : '-'}
                          </td>

                          {/* Net Payable */}
                          <td className="py-3 px-4 text-right font-mono font-black text-white text-sm">
                            ₹{s.fee.totalRemainingPayable.toLocaleString('en-IN')}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-center">
                            {cleanPhone && s.fee.baseRemainingFee > 0 ? (
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Send WhatsApp Reminder"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Remind</span>
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ATTENDANCE LOGS REPORT */}
      {/* ========================================================================= */}
      {reportType === 'attendance' && (
        <div className="space-y-5">
          
          {/* Filters Card */}
          <div className="print-hide bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-3">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>ATTENDANCE FILTER CRITERIA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Student</label>
                <select
                  value={selectedAttendanceStudent}
                  onChange={(e) => setSelectedAttendanceStudent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Students ({approvedStudents.length})</option>
                  {approvedStudents.map(s => (
                    <option key={s.id || s.rollNo} value={s.id || s.rollNo}>
                      {s.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Status</label>
                <select
                  value={selectedAttendanceStatus}
                  onChange={(e) => setSelectedAttendanceStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Found <strong className="text-white">{logs.length}</strong> Records</span>
                {loadingLogs && <span className="text-blue-400 font-semibold animate-pulse ml-2">Loading records...</span>}
              </div>

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilteredLogs}
                  disabled={loadingLogs}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Delete all attendance logs matching current filter"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Filtered ({logs.length})</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">In Time</th>
                    <th className="py-3 px-4">Out Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Daily Study Log 📚</th>
                    <th className="py-3 px-4">GPS Dist.</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        No attendance records found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => {
                      const logId = l.id || l._id;
                      const isDeleting = deletingId === logId;
                      return (
                        <tr key={logId || `${l.date}-${l.rollNo}`} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-200">
                            {l.date}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{l.studentName}</div>
                            <div className="text-[10px] font-mono text-blue-400">{l.rollNo}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            {l.punchInTime ? formatISTTime(l.punchInTime) : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-400">
                            {l.punchOutTime ? formatISTTime(l.punchOutTime) : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {l.durationMinutes ? `${Math.floor(l.durationMinutes / 60)}h ${l.durationMinutes % 60}m` : '-'}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            {l.studySummary ? (
                              <div className="text-xs text-slate-200 bg-slate-800 p-2 rounded-xl border border-slate-700/60 line-clamp-2">
                                📖 {l.studySummary}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {l.punchInDistance != null ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-400" />
                                <span>{Math.round(l.punchInDistance)}m</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.status === 'Present'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteLog(logId, l.studentName, l.date)}
                              title={`Delete attendance log for ${l.studentName} on ${l.date}`}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-white transition-all disabled:opacity-50"
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-pulse text-rose-400' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
