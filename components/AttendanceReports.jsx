'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Printer, Filter, Calendar,
  Search, Users, Clock, MapPin, CheckCircle2
} from 'lucide-react';
import { formatISTTime } from '@/lib/indianTime';

export default function AttendanceReports({
  institute,
  students = []
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedStudent ? { studentId: selectedStudent } : {}),
        status: selectedStatus
      }).toString();

      const res = await fetch(`/api/attendance/history?${query}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedStudent, selectedStatus]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = [
      'Date',
      'Roll Number',
      'Student Name',
      'Punch In Time',
      'Punch Out Time',
      'Duration (Minutes)',
      'Daily Study Log',
      'GPS Distance (meters)',
      'Status',
      'Remarks'
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

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SSSAM_Academy_Attendance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Attendance Reports & Export</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Filter, analyze, and export student attendance logs with study summaries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filter Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="space-y-1">
            <label className="font-semibold text-slate-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400">Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Students ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rollNo} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-white">
            Found <span className="text-emerald-400">{logs.length}</span> Records
          </div>
          {loading && (
            <div className="text-xs text-blue-400 font-mono animate-pulse">Loading records...</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">In Time</th>
                <th className="py-3.5 px-4">Out Time</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Daily Study Log 📚</th>
                <th className="py-3.5 px-4">GPS Dist.</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No attendance records found for the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">{log.studentName}</div>
                      <div className="text-[11px] font-mono text-blue-400">{log.rollNo}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                      {log.punchInTime ? formatISTTime(log.punchInTime) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 font-semibold whitespace-nowrap">
                      {log.punchOutTime ? formatISTTime(log.punchOutTime) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {log.durationMinutes ? `${Math.floor(log.durationMinutes / 60)}h ${log.durationMinutes % 60}m` : '-'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {log.studySummary ? (
                        <div className="text-xs text-slate-200 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 line-clamp-2">
                          📖 {log.studySummary}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.punchInDistance != null ? `${Math.round(log.punchInDistance)}m` : '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'Present'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.status === 'Late'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
