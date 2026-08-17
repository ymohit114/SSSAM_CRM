'use client';

import React from 'react';
import { Download, Smartphone, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 selection:bg-black selection:text-white">
      
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
        
        {/* App Logo */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-white border border-slate-200 shadow-md flex items-center justify-center mb-4 overflow-hidden">
            <img
              src="/logo.png"
              alt="SSSAM Portal Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Official Android APK</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            SSSAM Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            SSSAM Academy Student & Attendance Portal
          </p>
        </div>

        {/* Features list */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>High-Accuracy 25m Campus GPS Geofence</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>Live Course & Remaining Fee Tracker with Fine Breakdown</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" />
            <span>Fast 1-Tap Attendance Punch In / Punch Out</span>
          </div>
        </div>

        {/* Download Button */}
        <div className="space-y-3 pt-2">
          <a
            href="/SSSAM-Portal.apk"
            download="SSSAM-Portal.apk"
            className="w-full py-4 px-6 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Download APK (8.4 MB)</span>
          </a>

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>Safe & Verified • Version 1.0 (Android)</span>
          </div>
        </div>

        {/* Installation help in English */}
        <div className="pt-3 border-t border-slate-200 text-left text-[11px] text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <p className="font-bold text-slate-900">📲 Installation Steps:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
            <li>Tap <strong>"Download APK"</strong> above.</li>
            <li>Open the downloaded file from your browser downloads.</li>
            <li>Tap <strong>"Install"</strong> (allow unknown sources if prompted).</li>
          </ol>
        </div>

        {/* Back to Web Login */}
        <div className="pt-2">
          <Link
            href="/login"
            className="text-xs text-slate-700 hover:text-black font-bold inline-flex items-center gap-1"
          >
            <span>Open Web Version</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
