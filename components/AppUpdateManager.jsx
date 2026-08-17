'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone, UploadCloud, CheckCircle2, AlertTriangle,
  Plus, Trash2, RefreshCw, Send, ShieldAlert, Sparkles, HardDrive
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '@/config/appVersion';

export default function AppUpdateManager() {
  const [currentRelease, setCurrentRelease] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [formData, setFormData] = useState({
    version: '1.1.0',
    versionCode: 2,
    minVersion: '1.0.0',
    title: 'New SSSAM Portal Update Available! 🚀',
    description: 'Direct Cloud Sync, GPS Geofencing & Fee Notifications',
    releaseNotes: [
      '⚡ Direct MongoDB Atlas sync for registrations and real-time approvals',
      '📍 Enhanced Campus Geofence Accuracy & Instant Punch In/Out',
      '🔔 Automated Fee Due Reminders & Push Alerts',
      '🛡️ Performance optimizations and crash fixes'
    ],
    apkUrl: 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
    apkSize: '8.8 MB',
    forceUpdate: false
  });

  const [newNote, setNewNote] = useState('');

  const loadCurrentVersion = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/app-version?t=${Date.now()}`);
      const data = await res.json();
      if (data.latestVersion) {
        setCurrentRelease(data.latestVersion);
        setFormData({
          version: data.latestVersion.version || '1.1.0',
          versionCode: data.latestVersion.versionCode || 2,
          minVersion: data.latestVersion.minVersion || '1.0.0',
          title: data.latestVersion.title || 'New SSSAM Portal Update Available! 🚀',
          description: data.latestVersion.description || '',
          releaseNotes: data.latestVersion.releaseNotes?.length ? data.latestVersion.releaseNotes : [
            '⚡ Direct MongoDB Atlas sync for registrations and real-time approvals',
            '📍 Enhanced Campus Geofence Accuracy & Instant Punch In/Out'
          ],
          apkUrl: data.latestVersion.apkUrl || 'https://sssam-crm.vercel.app/SSSAM-Portal.apk',
          apkSize: data.latestVersion.apkSize || '8.8 MB',
          forceUpdate: Boolean(data.latestVersion.forceUpdate)
        });
      }
    } catch (err) {
      console.error('Error fetching current version:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentVersion();
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setFormData(prev => ({
      ...prev,
      releaseNotes: [...prev.releaseNotes, newNote.trim()]
    }));
    setNewNote('');
  };

  const handleRemoveNote = (idx) => {
    setFormData(prev => ({
      ...prev,
      releaseNotes: prev.releaseNotes.filter((_, i) => i !== idx)
    }));
  };

  const handlePublishUpdate = async (e) => {
    e.preventDefault();
    if (!formData.version.trim()) {
      setStatusMsg({ type: 'error', text: 'Version number is required (e.g. 1.1.0)' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/app-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to publish update');

      setStatusMsg({
        type: 'success',
        text: `🎉 In-App Update v${formData.version} published live! All mobile users will be prompted immediately.`
      });
      loadCurrentVersion();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to publish update.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>In-App Mobile Update Manager</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Broadcast new APK updates and changelogs to all student mobile apps in real-time
            </p>
          </div>
        </div>

        {/* Current Active Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <span className="text-slate-400">Live Release: </span>
            <span className="font-mono font-black text-emerald-400">v{currentRelease?.version || '1.1.0'}</span>
          </div>
          <button
            onClick={loadCurrentVersion}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Refresh Version Info"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-fade-in ${
          statusMsg.type === 'success'
            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Release Form */}
      <form onSubmit={handlePublishUpdate} className="space-y-5 text-xs">
        
        {/* Version Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Version String *</label>
            <input
              type="text"
              required
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              placeholder="e.g. 1.2.0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Version Code</label>
            <input
              type="number"
              value={formData.versionCode}
              onChange={(e) => setFormData(prev => ({ ...prev, versionCode: e.target.value }))}
              placeholder="e.g. 3"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">APK Size Label</label>
            <input
              type="text"
              value={formData.apkSize}
              onChange={(e) => setFormData(prev => ({ ...prev, apkSize: e.target.value }))}
              placeholder="e.g. 8.8 MB"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Update Title & APK Download URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Update Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. SSSAM Portal 1.2.0 Update 🚀"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">APK Direct Download Link *</label>
            <input
              type="url"
              required
              value={formData.apkUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, apkUrl: e.target.value }))}
              placeholder="https://sssam-crm.vercel.app/SSSAM-Portal.apk"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Force Update Toggle */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-2">
              <span>Force / Mandatory Update</span>
              {formData.forceUpdate && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Compulsory
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              When enabled, students cannot dismiss the update popup and must update to continue.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.forceUpdate}
              onChange={(e) => setFormData(prev => ({ ...prev, forceUpdate: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Release Notes Manager */}
        <div className="space-y-2.5">
          <label className="font-bold text-slate-300 block uppercase tracking-wider text-[11px]">
            Release Notes & Changelog (Points shown on Mobile App):
          </label>

          <div className="space-y-2">
            {formData.releaseNotes.map((note, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="flex-1 text-slate-200 text-xs">{note}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveNote(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Note input */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
              placeholder="Add a new feature or fix note (e.g. Faster GPS lock)..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>
        </div>

        {/* Publish Button */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{saving ? 'Publishing In-App Update...' : `Publish Update v${formData.version} to Mobile Apps`}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
