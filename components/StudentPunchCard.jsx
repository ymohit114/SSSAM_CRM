'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, Navigation, Sparkles, LogIn, LogOut, BellRing, Info
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [punching, setPunching] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [activeFeeReminder, setActiveFeeReminder] = useState(null);

  // Initialize notification permissions on mount
  useEffect(() => {
    initNotifications();
  }, []);

  // Study summary modal state for Punch Out
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [studySummary, setStudySummary] = useState('');
  const [studyError, setStudyError] = useState('');

  // Auto-select first student if available
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
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

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Check fee status whenever student changes
  useEffect(() => {
    if (selectedStudent) {
      const feeCheck = checkStudentFeeDueStatus(selectedStudent);
      if (feeCheck.hasReminder) {
        setActiveFeeReminder(feeCheck);
      } else {
        setActiveFeeReminder(null);
      }
    }
  }, [selectedStudent]);

  // Start Geofence Exit Watcher while punched in
  useEffect(() => {
    if (todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime && institute) {
      startGeofenceWatcher({
        studentId: selectedStudentId,
        studentName: selectedStudent?.name,
        instituteLat: institute.latitude,
        instituteLng: institute.longitude,
        geofenceRadius: institute.geofenceRadius || 50,
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

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.batchName && s.batchName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
    });
  };

  const handlePunchIn = async () => {
    // 1. Check if GPS position is acquired
    if (!gpsPosition || distance == null) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: '⚠️ GPS Location not detected yet. Please allow location permissions in your browser and tap "Refresh GPS Location".'
      });
      return;
    }

    // 2. Strict Geofence Enforcement: Must be within 50m radius
    if (!isInside) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: `❌ Punch In Blocked: You are ${Math.round(distance)}m away from ${institute?.name || 'SSSAM Academy'}. Maximum allowed distance is ${maxRadius}m. Please be inside campus.`
      });
      return;
    }

    setPunching(true);
    setStatusMessage(null);

    try {
      const res = await onPunchIn({
        studentId: selectedStudentId,
        lat: gpsPosition.latitude,
        lng: gpsPosition.longitude,
        overrideDistance: false
      });

      if (res.success) {
        sounds.playSuccess();
        triggerConfetti();
        setTodayRecord(res.record);
        setStatusMessage({
          type: 'success',
          text: `🎉 Attendance Marked! Status: ${res.record.status} at ${res.record.punchInTime}`
        });

        // 1. Dispatch Native Confirmation Notification
        sendLocalNotification({
          id: 1001,
          title: "✅ SSSAM Punch In Recorded",
          body: `Attendance marked successfully at ${res.record.punchInTime}. Welcome to SSSAM Academy!`
        });

        // 2. If fee is due within 7 days, trigger immediate fee notification
        if (res.feeReminder && res.feeReminder.hasReminder) {
          setActiveFeeReminder(res.feeReminder);
          sendLocalNotification({
            id: 1002,
            title: res.feeReminder.isOverdue ? "🚨 SSSAM Overdue Fee Notice" : "📌 SSSAM Fee Due Reminder",
            body: res.feeReminder.punchInMessage
          });
        }
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
        text: '⚠️ GPS Location not detected yet. Please allow location permissions and tap "Refresh GPS Location".'
      });
      return;
    }

    if (!isInside) {
      sounds.playError();
      setStatusMessage({
        type: 'error',
        text: `❌ Punch Out Blocked: You are ${Math.round(distance)}m away from campus. Maximum allowed distance is ${maxRadius}m.`
      });
      return;
    }

    setStudySummary('');
    setStudyError('');
    setShowStudyModal(true);
  };

  // Step 2: Confirm Punch Out after entering minimum 20 characters
  const handleConfirmPunchOut = async (e) => {
    if (e) e.preventDefault();

    if (!studySummary || studySummary.trim().length < 20) {
      setStudyError(`Please enter at least 20 characters. Current length: ${studySummary.trim().length}`);
      return;
    }

    setPunching(true);
    setStudyError('');

    try {
      const res = await onPunchOut({
        studentId: selectedStudentId,
        lat: gpsPosition.latitude,
        lng: gpsPosition.longitude,
        studySummary: studySummary.trim(),
        overrideDistance: false
      });

      if (res.success) {
        sounds.playPunchOut();
        setTodayRecord(res.record);
        stopGeofenceWatcher(); // Stop geofence exit watcher
        setShowStudyModal(false);
        setStudySummary('');
        setStatusMessage({
          type: 'success',
          text: `👋 Punch Out recorded at ${res.record.punchOutTime}. Duration: ${Math.floor(res.record.durationMinutes / 60)}h ${res.record.durationMinutes % 60}m`
        });

        // Dispatch Native Punch Out Confirmation Notification
        sendLocalNotification({
          id: 2001,
          title: "👋 SSSAM Punch Out Recorded",
          body: `Punch Out recorded at ${res.record.punchOutTime}. Duration: ${Math.floor(res.record.durationMinutes / 60)}h ${res.record.durationMinutes % 60}m. Great study session today!`
        });
      }
    } catch (err) {
      sounds.playError();
      setStudyError(err.message || "Punch Out failed.");
    } finally {
      setPunching(false);
    }
  };

  const isPunchedIn = todayRecord && todayRecord.punchInTime && !todayRecord.punchOutTime;
  const isPunchedOut = todayRecord && todayRecord.punchOutTime;
  const maxRadius = institute?.geofenceRadius || 50;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      


      {/* Main Punch Card */}
      <div className="glass-panel-glow rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* 7-Day Fee Due Date Alert Banner */}
        {activeFeeReminder && activeFeeReminder.hasReminder && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-lg animate-fade-in ${
            activeFeeReminder.isOverdue
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200 shadow-rose-950/40'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-200 shadow-amber-950/40'
          }`}>
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              activeFeeReminder.isOverdue ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  {activeFeeReminder.isOverdue ? '🚨 Fee Payment Overdue!' : '🔔 Upcoming Fee Due Date Alert'}
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  activeFeeReminder.isOverdue ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                }`}>
                  {activeFeeReminder.daysLabel}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {activeFeeReminder.punchInMessage}
              </p>
              <div className="text-[11px] font-mono opacity-80 pt-0.5">
                Remaining Balance: <strong className="text-white">₹{activeFeeReminder.remainingFee.toLocaleString('en-IN')}</strong> • Due Date: <strong className="text-white">{activeFeeReminder.dueDate}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Top: Student Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Select Student / Roll Number</span>
            <span className="text-[11px] text-blue-400 normal-case font-medium">{students.length} Enrolled Students</span>
          </label>

          <div className="relative">
            <div className="flex items-center bg-slate-900/90 border border-slate-700/70 rounded-2xl p-2.5 shadow-inner focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md mr-3 flex-shrink-0">
                {selectedStudent ? selectedStudent.name.charAt(0) : 'S'}
              </div>

              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Search by Roll No or Student Name..."
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
              >
                {showDropdown ? 'Close' : 'Browse'}
              </button>
            </div>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setSearchQuery(`${s.rollNo} - ${s.name}`);
                        setShowDropdown(false);
                      }}
                      className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                          {s.rollNo.split('-')[1] || s.rollNo}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-white">{s.name}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {s.rollNo}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No student found matching query</div>
                )}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Roll: <strong className="text-white font-mono">{selectedStudent.rollNo}</strong>
              </span>
              {selectedStudent.phone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs font-medium text-slate-300">
                  Phone: <strong className="text-white">{selectedStudent.phone}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: Geofence Radar Distance Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          <div className="space-y-4">
            <div className={`rounded-2xl p-5 border text-center transition-all ${
              distance == null
                ? 'bg-slate-900/90 border-slate-800'
                : isInside
                ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/10'
            }`}>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                {distance == null ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                    ACQUIRING GPS SIGNAL
                  </span>
                ) : isInside ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    INSIDE CAMPUS (ELIGIBLE)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    OUTSIDE CAMPUS (BLOCKED)
                  </span>
                )}
              </div>

              <div className="my-3">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                  {distance != null ? `${Math.round(distance)}` : '--'}
                  <span className="text-lg sm:text-xl font-medium text-slate-400 ml-1.5">meters</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Distance from <strong>{institute?.name || 'SSSAM Academy'}</strong> (Max Allowed: {maxRadius}m)
                </p>
              </div>

              {distance != null ? (
                <p className={`text-xs font-medium px-3 py-2 rounded-xl border ${
                  isInside
                    ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-900/30 border-rose-500/30 text-rose-200'
                }`}>
                  {isInside
                    ? `✅ GPS confirmed inside ${maxRadius}m geofence (${Math.round(distance)}m away). You can punch in or out now.`
                    : `❌ You are ${Math.round(distance)}m away. Attendance can only be marked within ${maxRadius}m of institute.`}
                </p>
              ) : (
                <div className="text-xs font-medium px-3 py-2.5 rounded-xl border bg-amber-950/40 border-amber-500/30 text-amber-200 space-y-1 text-left">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <span>📍 Waiting for GPS Permission / Signal</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Browser location permission allow karein aur niche <strong>&quot;Refresh GPS Location&quot;</strong> button dabayein.
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={refreshGPS}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 hover:bg-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
                  <span>{gpsLoading ? 'Acquiring GPS...' : 'Refresh GPS Location'}</span>
                </button>
              </div>

              {gpsError && (
                <div className="mt-2.5 text-left text-[11px] text-amber-300 bg-amber-950/60 p-3 rounded-xl border border-amber-500/30 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>⚠️ GPS Note:</span>
                  </div>
                  <p className="text-amber-200/80">{gpsError}</p>
                </div>
              )}
            </div>

            {/* Today's Punch Status Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Status</span>
                {todayRecord ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    todayRecord.status === 'Present'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : todayRecord.status === 'Late'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {todayRecord.status}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                    Not Punched Today
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-[11px]">Punch In Time</div>
                  <div className="font-mono font-bold text-white text-sm">
                    {todayRecord?.punchInTime ? formatISTTime(todayRecord.punchInTime) : '--:--:--'}
                  </div>
                </div>

                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-[11px]">Punch Out Time</div>
                  <div className="font-mono font-bold text-white text-sm">
                    {todayRecord?.punchOutTime ? formatISTTime(todayRecord.punchOutTime) : '--:--:--'}
                  </div>
                </div>
              </div>

              {isPunchedIn && (
                <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-blue-300 font-medium">
                    <Clock className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    <span>Active Session Duration:</span>
                  </div>
                  <div className="font-mono font-bold text-white text-sm">{elapsedTime}</div>
                </div>
              )}
            </div>

          </div>

          {/* Right: Live Interactive Map */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block flex items-center justify-between">
              <span>Geofence Boundary Map</span>
              <span className="text-[11px] text-slate-400 font-normal">50m Radius Visualizer</span>
            </label>

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

        </div>

        {/* Action Buttons: PUNCH IN & PUNCH OUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* PUNCH IN BUTTON */}
          <button
            id="btn-punch-in"
            type="button"
            disabled={punching || isPunchedIn || isPunchedOut || !isInside}
            onClick={handlePunchIn}
            className={`relative group overflow-hidden py-4 sm:py-5 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
              isPunchedIn || isPunchedOut
                ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : !isInside
                ? 'bg-slate-800/80 text-slate-500 border border-rose-500/30 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white hover:shadow-blue-500/30 hover:scale-[1.02] border border-blue-400/30'
            }`}
          >
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>
              {punching
                ? 'Marking Attendance...'
                : !isInside
                ? 'Outside 50m (Blocked)'
                : isPunchedIn
                ? 'Already Punched In'
                : isPunchedOut
                ? 'Completed for Today'
                : 'PUNCH IN'}
            </span>
          </button>

          {/* PUNCH OUT BUTTON */}
          <button
            id="btn-punch-out"
            type="button"
            disabled={punching || !isPunchedIn || isPunchedOut || !isInside}
            onClick={handleInitiatePunchOut}
            className={`relative group overflow-hidden py-4 sm:py-5 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
              !isPunchedIn || isPunchedOut
                ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : !isInside
                ? 'bg-slate-800/80 text-slate-500 border border-rose-500/30 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white hover:shadow-amber-500/30 hover:scale-[1.02] border border-amber-400/30'
            }`}
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>
              {punching
                ? 'Recording Out...'
                : !isInside
                ? 'Outside 50m (Blocked)'
                : isPunchedOut
                ? 'Punched Out (Done)'
                : 'PUNCH OUT'}
            </span>
          </button>

        </div>

        {/* Feedback Alert Message */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <div>{statusMessage.text}</div>
          </div>
        )}

      </div>

      {/* Mandatory Daily Study / Learning Report Modal on Punch Out */}
      {showStudyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            
            {/* Header */}
            <div className="space-y-1.5 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Punch Out Verification</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Session: <strong className="text-white">{elapsedTime}</strong>
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-black text-white">
                Aaj Aapne Kya Padhai Ki? 📚
              </h3>
              <p className="text-xs text-slate-400">
                Please enter your daily study / topic summary before punching out.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPunchOut} className="space-y-4">
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Daily Study Log (Min. 20 Characters) *
                  </label>
                  <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                    studySummary.trim().length >= 20
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {studySummary.trim().length} / 20 {studySummary.trim().length >= 20 ? '✅' : `(Need ${20 - studySummary.trim().length} more)`}
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={studySummary}
                  onChange={(e) => {
                    setStudySummary(e.target.value);
                    setStudyError('');
                  }}
                  autoFocus
                  required
                  placeholder="e.g. Aaj maine Mathematics me Calculus ke 15 questions solve kiye aur Physics lecture complete kiya..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {studyError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{studyError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStudyModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={punching || studySummary.trim().length < 20}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{punching ? 'Recording Out...' : 'Submit & Complete Punch Out'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
