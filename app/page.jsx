'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Radio, Clock, LogOut, History, User, BookOpen } from 'lucide-react';
import StudentPunchCard from '@/components/StudentPunchCard';
import StudentFeeCard from '@/components/StudentFeeCard';
import StudentHistoryModal from '@/components/StudentHistoryModal';
import { getCurrentPosition, calculateDistance } from '@/lib/geo';

export default function StudentPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [institute, setInstitute] = useState({
    name: 'SSSAM Academy',
    tagline: 'Excellence in Education & Training',
    latitude: 28.470452,
    longitude: 77.044462,
    geofenceRadius: 50,
    startTime: '09:00',
    lateThresholdMinutes: 15
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Check student authentication from localStorage & load fresh profile/fees
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sssam_user');
      if (stored) {
        const userObj = JSON.parse(stored);
        if (userObj && userObj.role === 'student') {
          setCurrentUser(userObj);

          // Fetch fresh details from API (latest course & remaining fees updated by Admin)
          fetch(`/api/students/${userObj.id || userObj.rollNo}`)
            .then(res => res.json())
            .then(data => {
              if (data.student) {
                setCurrentUser(prev => ({ ...prev, ...data.student }));
                localStorage.setItem('sssam_user', JSON.stringify({ ...userObj, ...data.student }));
              }
            })
            .catch(err => console.warn('Could not refresh student profile:', err));
        } else {
          router.push('/login?role=student');
        }
      } else {
        router.push('/login?role=student');
      }
    } catch {
      router.push('/login?role=student');
    } finally {
      setAuthChecked(true);
    }
  }, [router]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setInstitute(data.settings);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const acquireGPS = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const pos = await getCurrentPosition();
      setGpsPosition(pos);
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    acquireGPS();
    let watchId = null;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 0),
            timestamp: pos.timestamp
          });
          setGpsError(null);
        },
        (err) => {
          console.warn("GPS Watch error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [acquireGPS]);

  let distance = null;
  let isInside = false;
  const maxRadius = institute?.geofenceRadius || 50;

  if (gpsPosition && institute?.latitude && institute?.longitude) {
    distance = calculateDistance(
      gpsPosition.latitude,
      gpsPosition.longitude,
      institute.latitude,
      institute.longitude
    );
    isInside = distance <= maxRadius;
  }

  const handlePunchIn = async (data) => {
    const res = await fetch('/api/attendance/punch-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Punch in failed');
    return result;
  };

  const handlePunchOut = async (data) => {
    const res = await fetch('/api/attendance/punch-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Punch out failed');
    return result;
  };

  const handleLogout = () => {
    localStorage.removeItem('sssam_user');
    router.push('/login?role=student');
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  if (!authChecked || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400 font-mono text-sm">
        <div className="animate-pulse flex items-center gap-2">
          <span>Verifying student session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Brand & User info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center flex-shrink-0">
                <img src="/logo.svg" alt="SSSAM Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl font-black tracking-tight text-white">
                    {institute.name}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    50M GEOFENCE
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{currentUser.name}</span>
                  <span className="font-mono text-slate-500">({currentUser.rollNo})</span>
                </div>
              </div>
            </div>

            {/* Center Time (Desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/50 shadow-inner">
                <Clock className="w-4 h-4 text-blue-400" />
                <div className="text-xs font-mono font-bold text-white tracking-wider">{formattedTime}</div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                isInside
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {isInside ? `Inside (${Math.round(distance)}m)` : `Outside (${Math.round(distance)}m)`}
                </span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Personal History Button */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
              >
                <History className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">My Attendance</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-950 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Content: Course & Fee Card + Student Punch Card */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Enrolled Course & Remaining Fee Section */}
        <StudentFeeCard student={currentUser} />

        {/* GPS Geofenced Attendance Punch Card */}
        <StudentPunchCard
          students={[currentUser]}
          institute={institute}
          gpsPosition={gpsPosition}
          distance={distance}
          isInside={isInside}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          refreshGPS={acquireGPS}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
        />
      </main>

      {/* History Modal */}
      {showHistoryModal && (
        <StudentHistoryModal
          student={currentUser}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Logged in as <strong className="text-slate-300">{currentUser.name}</strong> ({currentUser.rollNo})
          </div>
          <div>
            &copy; {new Date().getFullYear()} {institute.name}. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
