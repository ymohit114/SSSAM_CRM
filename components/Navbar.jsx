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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm text-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Institute Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 p-1 shadow-sm flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="SSSAM Logo" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  {instituteName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  GEOFENCE 25M
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Student Attendance Portal & CRM
              </p>
            </div>
          </div>

          {/* Center: Live Clock & GPS Status (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Clock */}
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-inner">
              <Clock className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900 tracking-wider">{formattedTime}</div>
                <div className="text-[10px] text-slate-500 font-medium">{formattedDate}</div>
              </div>
            </div>

            {/* GPS Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-medium text-slate-900">
              <span className={`w-2 h-2 rounded-full ${gpsActive ? (isInside ? 'bg-black' : 'bg-slate-400') : 'bg-slate-400'}`}></span>
              <span>
                {gpsActive
                  ? isInside
                    ? `Inside Campus (${Math.round(distance)}m)`
                    : `Outside Campus (${Math.round(distance)}m)`
                  : 'Locating GPS...'}
              </span>
              {gpsAccuracy && (
                <span className="text-[10px] text-slate-500 font-mono">±{gpsAccuracy}m</span>
              )}
            </div>
          </div>

          {/* Navigation Tabs / Mode Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-kiosk"
              onClick={() => setActiveTab('punch')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'punch'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
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
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab !== 'punch'
                  ? 'bg-black text-white shadow-md'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100 border border-slate-200'
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
