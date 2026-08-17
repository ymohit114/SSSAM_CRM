'use client';

import React, { useState, useEffect } from 'react';
import InstituteSettings from '@/components/InstituteSettings';
import AppUpdateManager from '@/components/AppUpdateManager';
import { MapPin, Smartphone, Sliders, Sparkles } from 'lucide-react';

export default function AdminSettingsPage() {
  const [institute, setInstitute] = useState(null);
  const [activeTab, setActiveTab] = useState('updates'); // 'geofence' | 'updates'

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setInstitute(data.settings);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>System & App Configuration</span>
            <Sliders className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Campus GPS geofencing, timing rules, and mobile app in-app update releases
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto shadow-lg">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'updates'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile App Updates</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'geofence'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Campus GPS & Geofence</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'updates' && (
        <div className="animate-fade-in">
          <AppUpdateManager />
        </div>
      )}

      {activeTab === 'geofence' && (
        <div className="animate-fade-in">
          <InstituteSettings
            institute={institute}
            onSettingsSaved={(updated) => setInstitute(updated)}
          />
        </div>
      )}

    </div>
  );
}
