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
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Institute Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-700 p-1 shadow-md flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="SSSAM Logo" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  {instituteName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
                  GEOFENCE 25M
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                Student Attendance Portal & CRM
              </p>
            </div>
          </div>

          {/* Center: Live Clock & GPS Status (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Clock */}
            <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-800 shadow-inner">
              <Clock className="w-4 h-4 text-zinc-400" />
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white tracking-wider">{formattedTime}</div>
                <div className="text-[10px] text-zinc-400 font-medium">{formattedDate}</div>
              </div>
            </div>

            {/* GPS Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-medium text-white">
              <span className={`w-2 h-2 rounded-full ${gpsActive ? (isInside ? 'bg-white' : 'bg-zinc-500') : 'bg-zinc-600'}`}></span>
              <span>
                {gpsActive
                  ? isInside
                    ? `Inside Campus (${Math.round(distance)}m)`
                    : `Outside Campus (${Math.round(distance)}m)`
                  : 'Locating GPS...'}
              </span>
              {gpsAccuracy && (
                <span className="text-[10px] text-zinc-400 font-mono">±{gpsAccuracy}m</span>
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
                  ? 'bg-white text-black shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
                  ? 'bg-white text-black shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800'
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
