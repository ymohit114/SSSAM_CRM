'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, MapPin, Navigation, Clock, Check,
  AlertCircle, Save, Sliders
} from 'lucide-react';
import { getCurrentPosition } from '@/lib/geo';
import dynamic from 'next/dynamic';

const GeofenceMap = dynamic(() => import('./GeofenceMap'), { ssr: false });

export default function InstituteSettings({
  institute,
  onSettingsSaved
}) {
  const [formData, setFormData] = useState({
    name: 'SSSAM Academy',
    tagline: 'Excellence in Education & Training',
    address: 'Ground Floor, M-24, near SBI Bank, Block M, Old DLF Colony, Sector 14, Gurugram, Haryana 122001',
    latitude: 28.470455,
    longitude: 77.044455,
    geofenceRadius: 25,
    startTime: '09:00',
    lateThresholdMinutes: 15,
    endTime: '17:00',
    adminPin: '1234'
  });

  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (institute) {
      setFormData({
        name: institute.name || 'SSSAM Academy',
        tagline: institute.tagline || '',
        address: institute.address || 'Ground Floor, M-24, near SBI Bank, Block M, Old DLF Colony, Sector 14, Gurugram, Haryana 122001',
        latitude: institute.latitude || 28.470455,
        longitude: institute.longitude || 77.044455,
        geofenceRadius: institute.geofenceRadius || 25,
        startTime: institute.startTime || '09:00',
        lateThresholdMinutes: institute.lateThresholdMinutes || 15,
        endTime: institute.endTime || '17:00',
        adminPin: institute.adminPin || '1234'
      });
    }
  }, [institute]);

  const handleCaptureCurrentGPS = async () => {
    setLocating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const pos = await getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude
      }));
      setSuccessMsg(`📍 Successfully captured your GPS coordinates (±${pos.accuracy}m accuracy)! Click 'Save Settings' to apply.`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not acquire GPS position. Please check location permissions.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');

      setSuccessMsg('✅ Institute settings and Geofence updated successfully!');
      if (onSettingsSaved) onSettingsSaved(data.settings);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            <span>Institute & Geofence Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure institute GPS location coordinates, 50-meter radius threshold, and class timings.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card 1: GPS Coordinates & Geofencing */}
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Institute GPS Geofence Settings</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Students must be within this perimeter to Punch In / Out.
              </p>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={handleCaptureCurrentGPS}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Detecting Location...' : '📍 Use My Current GPS Location'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Latitude</span>
                <span className="text-[10px] text-slate-500 font-mono">Decimal Degrees</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Longitude</span>
                <span className="text-[10px] text-slate-500 font-mono">Decimal Degrees</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Radius Slider */}
          <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Allowed Attendance Radius</span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm shadow-md">
                {formData.geofenceRadius} meters
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={formData.geofenceRadius}
              onChange={(e) => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10m (Classroom)</span>
              <span className="text-blue-400 font-bold">25m (Academy Boundary)</span>
              <span>100m (Extended)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Geofence Perimeter Preview</label>
            <GeofenceMap
              instituteLat={formData.latitude}
              instituteLng={formData.longitude}
              instituteRadius={formData.geofenceRadius}
              instituteName={formData.name}
            />
          </div>
        </div>

        {/* Card 2: Institute Details & Timings */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Institute Details & Policy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Institute Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tagline / Motto</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Institute Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Late Grace Period</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.lateThresholdMinutes}
                  onChange={(e) => setFormData({ ...formData, lateThresholdMinutes: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">mins</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Admin PIN</label>
              <input
                type="password"
                maxLength={6}
                value={formData.adminPin}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
