'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, Navigation, Sparkles, LogIn, LogOut, BellRing, ChevronDown, ChevronUp, Layers, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import dynamic from 'next/dynamic';
import { sounds } from '@/lib/sounds';
import { initNotifications, sendLocalNotification } from '@/lib/notifications';
import { startGeofenceWatcher, stopGeofenceWatcher } from '@/lib/geoWatcher';
import { checkStudentFeeDueStatus } from '@/lib/feeReminderService';
import { formatISTTime } from '@/lib/indianTime';

// Dynamically import GeofenceMap to prevent SSR leaflet errors
const GeofenceMap = dynamic(() => import('./GeofenceMap'), { ssr: false });

export default function StudentPunchCard({
  students = [],
  institute,
  gpsPosition,
  distance,
  isInside,
  gpsLoading,
  gpsError,
  refreshGPS,
  onPunchIn,
  onPunchOut
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [punching, setPunching] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [activeFeeReminder, setActiveFeeReminder] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Initialize notification permissions on mount
  useEffect(() => {
    initNotifications();
  }, []);

  // Study summary modal state for Punch Out
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [studySummary, setStudySummary] = useState('');
  const [studyError, setStudyError] = useState('');

  // Auto-select logged in student
  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      const first = students[0];
      setSelectedStudentId(first.id || first._id || first.rollNo);
    }
  }, [students, selectedStudentId]);

  // Fetch student status for today whenever selectedStudentId changes
  const fetchStudentStatus = useCallback(async (studentId) => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/attendance/status/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.todayRecord || null);
      }
    } catch (err) {
      console.error("Error fetching student status:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentStatus(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentStatus]);

  // Session stopwatch timer
  useEffect(() => {
    let interval = null;
    if (todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime) {
      const updateTimer = () => {
        const now = new Date();
        const [hours, mins, secs] = todayRecord.punchInTime.split(':').map(Number);
        const punchDate = new Date();
        punchDate.setHours(hours, mins, secs || 0, 0);

        const diffMs = Math.max(0, now - punchDate);
        const diffSecs = Math.floor(diffMs / 1000);

        const h = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
        const m = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
        const s = String(diffSecs % 60).padStart(2, '0');

        setElapsedTime(`${h}:${m}:${s}`);
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayRecord]);

  const selectedStudent = students.find(s => s.id === selectedStudentId || s._id === selectedStudentId) || students[0] || null;

  // Check fee status whenever student changes
  useEffect(() => {
    if (selectedStudent) {
      const feeStatus = checkStudentFeeDueStatus(selectedStudent);
      setActiveFeeReminder(feeStatus);
    }
  }, [selectedStudent]);

  // Start background geofence exit watcher if punched in
  useEffect(() => {
    if (todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime && selectedStudentId && institute?.latitude) {
      startGeofenceWatcher({
        studentId: selectedStudentId,
        studentName: selectedStudent?.name,
        instituteLat: institute.latitude,
        instituteLng: institute.longitude,
        geofenceRadius: institute.geofenceRadius || 25,
        isPunchedIn: true,
        isPunchedOut: false
      });
    } else {
      stopGeofenceWatcher();
    }

    return () => {
      stopGeofenceWatcher();
    };
  }, [todayRecord, selectedStudentId, selectedStudent, institute]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
    });
  };

  const handlePunchIn = async () => {
    if (!selectedStudentId) {
      setStatusMessage({ type: 'error', text: 'Please select a student first.' });
      return;
    }

    if (!gpsPosition || distance == null) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: '⚠️ GPS Location not detected. Please allow location permissions and tap "Refresh GPS".'
      });
      return;
    }

    if (!isInside) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: `❌ You are ${Math.round(distance)}m away from ${institute?.name || 'campus'}. Please be inside the 25m campus perimeter.`
      });
      return;
    }

    setPunching(true);
    setStatusMessage(null);

    try {
      const clientNow = new Date();
      const clientTime = clientNow.toLocaleTimeString('en-GB', { hour12: false });
      const clientDate = clientNow.toLocaleDateString('en-CA');

      const res = await onPunchIn({
        studentId: selectedStudentId,
        lat: gpsPosition.latitude,
        lng: gpsPosition.longitude,
        time: clientTime,
        date: clientDate,
        overrideDistance: false
      });

      if (res.success) {
        sounds.playSuccess();
        triggerConfetti();
        setTodayRecord(res.record);
        setStatusMessage({
          type: 'success',
          text: `🎉 Attendance Marked at ${formatISTTime(res.record.punchInTime)}!`
        });

        // Dispatch Native Notification
        sendLocalNotification({
          id: 1001,
          title: "✅ SSSAM Punch In Recorded",
          body: `Attendance marked successfully at ${formatISTTime(res.record.punchInTime)}. Welcome to SSSAM Academy!`
        });
      }
    } catch (err) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: err.message || "Punch In failed. Please try again."
      });
    } finally {
      setPunching(false);
    }
  };

  // Step 1: Open Study Summary modal when clicking Punch Out
  const handleInitiatePunchOut = () => {
    if (!gpsPosition || distance == null) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: '⚠️ GPS Location not detected yet. Please tap "Refresh GPS".'
      });
      return;
    }

    if (!isInside) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: `❌ You are ${Math.round(distance)}m away from campus. Must be inside 25m boundary to punch out.`
      });
      return;
    }

    setStudySummary('');
    setStudyError('');
    setShowStudyModal(true);
  };

  // Step 2: Confirm Punch Out
  const handleConfirmPunchOut = async (e) => {
    if (e) e.preventDefault();

    if (!studySummary || studySummary.trim().length < 20) {
      setStudyError(`Please write what you studied today (min 20 chars). Current: ${studySummary.trim().length}`);
      return;
    }

    setPunching(true);
    setStudyError('');

    try {
      const clientNow = new Date();
      const clientTime = clientNow.toLocaleTimeString('en-GB', { hour12: false });
      const clientDate = clientNow.toLocaleDateString('en-CA');

      const res = await onPunchOut({
        studentId: selectedStudentId,
        lat: gpsPosition.latitude,
        lng: gpsPosition.longitude,
        studySummary: studySummary.trim(),
        time: clientTime,
        date: clientDate,
        overrideDistance: false
      });

      if (res.success) {
        sounds.playPunchOut();
        setTodayRecord(res.record);
        stopGeofenceWatcher();
        setShowStudyModal(false);
        setStudySummary('');
        setStatusMessage({
          type: 'success',
          text: `👋 Punch Out recorded at ${formatISTTime(res.record.punchOutTime)}. Duration: ${Math.floor(res.record.durationMinutes / 60)}h ${res.record.durationMinutes % 60}m`
        });

        sendLocalNotification({
          id: 1003,
          title: "👋 SSSAM Punch Out Recorded",
          body: `Punch Out saved at ${formatISTTime(res.record.punchOutTime)}. Great work today!`
        });
      }
    } catch (err) {
      sounds.playError();
      setStudyError(err.message || 'Punch Out failed.');
    } finally {
      setPunching(false);
    }
  };

  const isPunchedIn = todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime;
  const isPunchedOut = todayRecord && todayRecord.punchOutTime;
  const maxRadius = institute?.geofenceRadius || 25;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      
      {/* 7-Day Fee Alert (Only if active) */}
      {activeFeeReminder && activeFeeReminder.hasReminder && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-md animate-fade-in ${
          activeFeeReminder.isOverdue
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span>{activeFeeReminder.punchInMessage}</span>
          </div>
          <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-black/30 text-white flex-shrink-0">
            Due: {activeFeeReminder.dueDate}
          </span>
        </div>
      )}

      {/* Main Clean Punch Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Top Status & GPS Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
          
          {/* GPS Campus Eligibility Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshGPS}
              disabled={gpsLoading}
              title="Refresh GPS Location"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                distance == null
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : isInside
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                distance == null ? 'bg-amber-400 animate-ping' : isInside ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}></span>
              <span>
                {distance == null
                  ? 'Acquiring GPS...'
                  : isInside
                  ? `Inside Campus (${Math.round(distance)}m)`
                  : `Outside Campus (${Math.round(distance)}m / Max ${maxRadius}m)`}
              </span>
              <RefreshCw className={`w-3 h-3 text-slate-400 hover:text-white ${gpsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Today's Status Badge */}
          <div>
            {todayRecord ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {todayRecord.status || 'Present'}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                Not Punched Today
              </span>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className={`p-3.5 rounded-2xl border text-xs font-medium animate-fade-in flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white ml-2 text-xs">✕</button>
          </div>
        )}

        {/* PRIMARY ACTION SECTION */}
        <div className="py-2 text-center space-y-4">
          
          {/* Active Session Display (When punched in) */}
          {isPunchedIn && (
            <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 max-w-sm mx-auto space-y-1">
              <div className="text-xs text-blue-300 font-medium flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Active Study Session</span>
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest">
                {elapsedTime}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Started at {formatISTTime(todayRecord.punchInTime)}
              </div>
            </div>
          )}

          {/* Large Tactile Punch Button */}
          <div className="max-w-md mx-auto">
            {!isPunchedIn && !isPunchedOut && (
              <button
                id="btn-punch-in"
                type="button"
                disabled={punching || !isInside}
                onClick={handlePunchIn}
                className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                  !isInside
                    ? 'bg-slate-800/80 text-slate-500 border border-rose-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:shadow-blue-500/30 hover:scale-[1.02] border border-blue-400/30'
                }`}
              >
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>
                  {punching
                    ? 'Marking Attendance...'
                    : !isInside
                    ? `Outside Campus (${Math.round(distance || 0)}m)`
                    : 'PUNCH IN'}
                </span>
              </button>
            )}

            {isPunchedIn && (
              <button
                id="btn-punch-out"
                type="button"
                disabled={punching || !isInside}
                onClick={handleInitiatePunchOut}
                className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                  !isInside
                    ? 'bg-slate-800/80 text-slate-500 border border-rose-500/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white hover:shadow-amber-500/30 hover:scale-[1.02] border border-amber-400/30'
                }`}
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>
                  {punching
                    ? 'Recording...'
                    : !isInside
                    ? `Outside Campus (${Math.round(distance || 0)}m)`
                    : 'PUNCH OUT & END SESSION'}
                </span>
              </button>
            )}

            {isPunchedOut && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
                <div className="text-emerald-400 font-bold text-sm sm:text-base flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Today's Attendance Completed!</span>
                </div>
                <p className="text-xs text-slate-400">
                  Great job! You have successfully punched in & out for today.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Today Summary Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 text-center text-xs">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Punch In</span>
            <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
              {todayRecord?.punchInTime ? formatISTTime(todayRecord.punchInTime) : '--:--'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Punch Out</span>
            <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
              {todayRecord?.punchOutTime ? formatISTTime(todayRecord.punchOutTime) : '--:--'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Duration</span>
            <span className="font-mono font-bold text-white text-sm mt-0.5 block">
              {todayRecord?.durationMinutes ? `${Math.floor(todayRecord.durationMinutes / 60)}h ${todayRecord.durationMinutes % 60}m` : (isPunchedIn ? elapsedTime : '--')}
            </span>
          </div>
        </div>

        {/* Campus Map Toggle */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Campus Geofence Map ({maxRadius}m Zone)</span>
            </span>
            {showMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMap && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 animate-fade-in">
              <GeofenceMap
                instituteLat={institute?.latitude}
                instituteLng={institute?.longitude}
                instituteRadius={maxRadius}
                instituteName={institute?.name || "SSSAM Academy"}
                userLat={gpsPosition ? gpsPosition.latitude : null}
                userLng={gpsPosition ? gpsPosition.longitude : null}
                userAccuracy={gpsPosition ? gpsPosition.accuracy : null}
                isInside={isInside}
                distance={distance}
              />
            </div>
          )}
        </div>

      </div>

      {/* Study Summary Modal (For Punch Out) */}
      {showStudyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Daily Study Summary</h3>
              </div>
              <button
                onClick={() => setShowStudyModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please enter what topics / practicals you completed today before punch out (min 20 characters):
            </p>

            <form onSubmit={handleConfirmPunchOut} className="space-y-3">
              <textarea
                value={studySummary}
                onChange={(e) => setStudySummary(e.target.value)}
                placeholder="e.g. Practiced MS Excel VLOOKUP formulas and completed assignment #4..."
                rows={4}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-between text-[11px]">
                <span className={studySummary.trim().length >= 20 ? 'text-emerald-400' : 'text-slate-500'}>
                  {studySummary.trim().length}/20 characters min
                </span>
              </div>

              {studyError && (
                <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                  {studyError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudyModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={punching || studySummary.trim().length < 20}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg"
                >
                  {punching ? 'Recording...' : 'Confirm Punch Out'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
