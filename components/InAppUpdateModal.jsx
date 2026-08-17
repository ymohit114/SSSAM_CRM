'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DownloadCloud, Sparkles, CheckCircle2, AlertTriangle,
  X, RefreshCw, Smartphone, ShieldCheck, ArrowRight, HardDrive
} from 'lucide-react';
import { CURRENT_APP_VERSION, compareVersions } from '@/config/appVersion';

export default function InAppUpdateModal({ onUpdateAvailable }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [manualCheckMsg, setManualCheckMsg] = useState(null);

  const checkVersion = useCallback(async (isManual = false) => {
    try {
      const res = await fetch(`/api/app-version?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.latestVersion && data.latestVersion.version) {
        const hasUpdate = compareVersions(CURRENT_APP_VERSION, data.latestVersion.version) > 0;
        
        if (hasUpdate) {
          // Check if user dismissed this specific version in this session (unless forceUpdate is true)
          const dismissedVersion = sessionStorage.getItem('dismissed_update_version');
          if (isManual || data.latestVersion.forceUpdate || dismissedVersion !== data.latestVersion.version) {
            setUpdateInfo(data.latestVersion);
            setIsOpen(true);
            if (onUpdateAvailable) onUpdateAvailable(data.latestVersion);
          }
        } else if (isManual) {
          setManualCheckMsg('✅ You are on the latest version of SSSAM Portal (v' + CURRENT_APP_VERSION + ')!');
          setTimeout(() => setManualCheckMsg(null), 4000);
        }
      }
    } catch (err) {
      console.warn('In-app update check notice:', err.message);
    }
  }, [onUpdateAvailable]);

  useEffect(() => {
    // Check for updates 2 seconds after app mount
    const timer = setTimeout(() => {
      checkVersion(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [checkVersion]);

  const handleStartUpdate = () => {
    setDownloading(true);
    setDownloadProgress(10);

    const downloadUrl = updateInfo?.apkUrl || 'https://sssam-crm.vercel.app/SSSAM-Portal.apk';

    // Simulate animated download progress
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setDownloadComplete(true);
        setDownloading(false);

        // Trigger direct browser / Android APK download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'SSSAM-Portal.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setDownloadProgress(progress);
      }
    }, 300);
  };

  const handleDismiss = () => {
    if (updateInfo?.forceUpdate) return; // Cannot dismiss force updates
    if (updateInfo?.version) {
      sessionStorage.setItem('dismissed_update_version', updateInfo.version);
    }
    setIsOpen(false);
  };

  if (!isOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-indigo-500/20 blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3" />
                <span>New Update Available</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {updateInfo.title || 'SSSAM Portal Update'}
              </h3>
            </div>
          </div>

          {!updateInfo.forceUpdate && !downloading && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Version Compare Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Current:</span>
            <span className="font-mono font-bold text-slate-300">v{CURRENT_APP_VERSION}</span>
          </div>

          <ArrowRight className="w-4 h-4 text-indigo-400" />

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">Latest:</span>
            <span className="font-mono font-black text-white bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              v{updateInfo.version}
            </span>
          </div>
        </div>

        {/* Release Notes */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <span>What's New in this Version:</span>
            <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[10px]">
              <HardDrive className="w-3 h-3" />
              <span>{updateInfo.apkSize || '8.8 MB'}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 max-h-48 overflow-y-auto">
            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 ? (
              updateInfo.releaseNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-200 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">Performance improvements and stability fixes.</p>
            )}
          </div>
        </div>

        {/* Downloading State Progress Bar */}
        {downloading && (
          <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Downloading Update Package...</span>
              </span>
              <span className="font-mono">{downloadProgress}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Download Complete Notice */}
        {downloadComplete && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Update downloaded! Please tap the downloaded APK in notification bar to install.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {!updateInfo.forceUpdate && !downloading && (
            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all text-center"
            >
              Remind Later
            </button>
          )}

          <button
            type="button"
            disabled={downloading}
            onClick={handleStartUpdate}
            className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{downloadComplete ? 'Download Again' : 'Download & Update Now'}</span>
          </button>
        </div>

        {/* Force Update Footer Notice */}
        {updateInfo.forceUpdate && (
          <p className="text-[10px] text-center text-amber-400 font-semibold flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>This is a compulsory update required to continue using SSSAM Portal.</span>
          </p>
        )}

      </div>
    </div>
  );
}
