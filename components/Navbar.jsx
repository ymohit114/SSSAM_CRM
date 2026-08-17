'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock, Radio } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  instituteName = "SSSAM Academy",
  gpsActive = false,
  gpsAccuracy = null,
  distance = null,
  isInside = false,
  onAdminClick
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Institute Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <img src="/logo.svg" alt="SSSAM Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  {instituteName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  GEOFENCE 50M
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Next.js Student Attendance Portal & CRM
              </p>
            </div>
          </div>

          {/* Center: Live Clock & GPS Status (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Clock */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/50 shadow-inner">
              <Clock className="w-4 h-4 text-blue-400" />
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white tracking-wider">{formattedTime}</div>
                <div className="text-[10px] text-slate-400 font-medium">{formattedDate}</div>
              </div>
            </div>

            {/* GPS Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              gpsActive
                ? isInside
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${gpsActive ? 'animate-pulse' : ''}`} />
              <span>
                {gpsActive
                  ? isInside
                    ? `Inside Campus (${Math.round(distance)}m)`
                    : `Outside Campus (${Math.round(distance)}m)`
                  : 'Locating GPS...'}
              </span>
              {gpsAccuracy && (
                <span className="text-[10px] opacity-75">±{gpsAccuracy}m</span>
              )}
            </div>
          </div>

          {/* Navigation Tabs / Mode Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-kiosk"
              onClick={() => setActiveTab('punch')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'punch'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Punch In/Out</span>
            </button>

            <button
              id="tab-admin"
              onClick={() => {
                if (activeTab === 'punch') {
                  onAdminClick();
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab !== 'punch'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
