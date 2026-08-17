'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle2, Clock, BookOpen, AlertTriangle,
  Award, X, MapPin
} from 'lucide-react';
import { formatISTTime } from '@/lib/indianTime';

export default function StudentHistoryModal({ student, onClose }) {
  const [history, setHistory] = useState({ logs: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    const identifier = student.id || student._id || student.rollNo;
    if (!identifier) return;
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auth/student-history/${encodeURIComponent(identifier)}`);
        const data = await res.json();
        if (data.success) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching student history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [student]);

  const { logs = [], stats = {} } = history;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white font-black text-xl shadow-md">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{student.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {student.rollNo}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-black border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-shrink-0">
          
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Punches</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">{stats.totalDays || 0}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Present Days</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">{stats.presentDays || 0}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Study Hours</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">{stats.totalHours || 0}h</div>
          </div>

        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Attendance Logs</div>
          
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
              Loading your attendance records...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
              No attendance records found yet. Punch in today to start!
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2 text-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{log.date}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                      {log.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-700">
                    Duration: <strong className="text-slate-900">{Math.floor((log.durationMinutes || 0) / 60)}h {(log.durationMinutes || 0) % 60}m</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div>
                    In: <span className="text-slate-900 font-mono font-semibold">{log.punchInTime ? formatISTTime(log.punchInTime) : '-'}</span>
                    {'  '}•{'  '}
                    Out: <span className="text-slate-900 font-mono font-semibold">{log.punchOutTime ? formatISTTime(log.punchOutTime) : '-'}</span>
                  </div>
                  {log.punchInDistance != null && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-700" />
                      <span>{Math.round(log.punchInDistance)}m</span>
                    </div>
                  )}
                </div>

                {log.studySummary && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Daily Study Log:</span>
                    <p className="line-clamp-2">{log.studySummary}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
