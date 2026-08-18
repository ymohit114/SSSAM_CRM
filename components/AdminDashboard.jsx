'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, Clock, AlertTriangle, UserX,
  Search, PlusCircle, RefreshCw, Eye, MapPin, ShieldCheck, LogOut, CheckCircle2
} from 'lucide-react';
import ManualAttendanceModal from './ManualAttendanceModal';
import AdminPunchOutModal from './AdminPunchOutModal';
import { formatISTTime } from '@/lib/indianTime';

export default function AdminDashboard({
  institute,
  students = [],
  onNavigateTab
}) {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedPunchOut, setSelectedPunchOut] = useState(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null);

  const loadTodayAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/today');
      const data = await res.json();
      if (data.success) {
        setTodayData(data);
      }
    } catch (err) {
      console.error('Error loading today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
    const interval = setInterval(loadTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = todayData?.stats || {
    totalStudents: students.length,
    presentToday: 0,
    currentlyOnCampus: 0,
    absentToday: 0,
    attendanceRate: 0
  };

  const roster = (todayData?.fullRoster || []).filter(({ student }) => {
    return (
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Faculty & Admin Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geofenced attendance tracking for <strong>{institute?.name || 'SSSAM Academy'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Entry</span>
          </button>

          <button
            onClick={loadTodayAttendance}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Clean 4-Card Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.totalStudents}</div>
          <div className="text-[10px] text-slate-500">Active Students</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 space-y-1 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{stats.presentToday}</div>
          <div className="text-[10px] text-emerald-400/80">{stats.attendanceRate}% Attendance Rate</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 space-y-1 bg-blue-950/10">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">On Campus</span>
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-300 font-mono">{stats.currentlyOnCampus}</div>
          <div className="text-[10px] text-blue-400/80">Punched in now</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-rose-500/20 space-y-1 bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent Today</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{stats.absentToday}</div>
          <div className="text-[10px] text-rose-400/80">Not Punched In</div>
        </div>

      </div>

      {/* Today's Live Attendance Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Today&apos;s Attendance Roster</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Punch In</th>
                <th className="py-3 px-4">Punch Out</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Daily Study Log 📚</th>
                <th className="py-3 px-4">GPS Dist.</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No students match the search query.
                  </td>
                </tr>
              ) : (
                roster.map(({ student, attendance }) => {
                  const isPresent = Boolean(attendance.punchInTime);
                  const isPunchedIn = isPresent && !attendance.punchOutTime;
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{student.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-blue-400">
                          {student.rollNo}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                        {attendance.punchInTime ? formatISTTime(attendance.punchInTime) : (
                          <span className="text-slate-500 font-sans text-xs">Not Punched</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-amber-400">
                        {attendance.punchOutTime ? formatISTTime(attendance.punchOutTime) : (isPresent ? (
                          <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-sans">
                            In Session
                          </span>
                        ) : '-')}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {attendance.durationMinutes ? `${Math.floor(attendance.durationMinutes / 60)}h ${attendance.durationMinutes % 60}m` : '-'}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {attendance.studySummary ? (
                          <div className="text-xs text-slate-200 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 line-clamp-2">
                            📖 {attendance.studySummary}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {attendance.punchInDistance != null ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>{Math.round(attendance.punchInDistance)}m</span>
                          </div>
                        ) : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPunchedIn ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPunchOut({ student, attendance })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 hover:scale-105"
                            title={`Punch Out ${student.name}`}
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>⚡ Punch Out</span>
                          </button>
                        ) : attendance.punchOutTime ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowManualModal(true)}
                            className="text-slate-500 hover:text-slate-300 text-[11px] underline"
                          >
                            Manual Entry
                          </button>
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

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <ManualAttendanceModal
          isOpen={true}
          students={students}
          onClose={() => setShowManualModal(false)}
          onSaved={() => {
            setShowManualModal(false);
            loadTodayAttendance();
          }}
        />
      )}

      {/* Admin Quick Punch Out Modal */}
      {selectedPunchOut && (
        <AdminPunchOutModal
          student={selectedPunchOut.student}
          attendance={selectedPunchOut.attendance}
          onClose={() => setSelectedPunchOut(null)}
          onSuccess={() => {
            setSelectedPunchOut(null);
            loadTodayAttendance();
          }}
        />
      )}

    </div>
  );
}
