'use client';

import React from 'react';
import { Download, Smartphone, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6 relative z-10 animate-fade-in">
        
        {/* App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-blue-400 shadow-xl shadow-blue-600/30 flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="SSSAM Portal Logo"
              className="w-full h-full object-cover rounded-[22px] bg-white"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Android App</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SSSAM Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            SSSAM Academy Student & Attendance Portal
          </p>
        </div>

        {/* Features list */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>High-Accuracy Native 50m GPS Attendance</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Live Course & Remaining Fee Tracker</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Fast 1-Tap Attendance Punch In / Punch Out</span>
          </div>
        </div>

        {/* Download Button */}
        <div className="space-y-3 pt-2">
          <a
            href="/SSSAM-Portal.apk"
            download="SSSAM-Portal.apk"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Download APK (5.5 MB)</span>
          </a>

          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe & Verified • Version 1.0 (Android)</span>
          </div>
        </div>

        {/* Installation help */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">📲 Installation Guide:</p>
          <p>Download complete hone ke baad notification par tap karein aur <strong>"Install"</strong> par click karein.</p>
        </div>

        {/* Back to Web Login */}
        <div className="pt-2">
          <Link
            href="/login"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <span>Open Web Version</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
