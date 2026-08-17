'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, LogIn, Lock, User, CheckCircle2, AlertTriangle, UserPlus
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Student Login State (Mobile Number or Roll Number)
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !studentPassword.trim()) {
      setErrorMsg('Please enter your Mobile Number or Roll Number, and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentIdInput.trim(),
          password: studentPassword.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('sssam_user', JSON.stringify(data.user));
      setSuccessMsg(`Welcome, ${data.user.name}! Redirecting...`);
      
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid Mobile Number, Roll Number, or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-600/20 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="SSSAM Logo" className="w-14 h-14 rounded-xl object-cover bg-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SSSAM Academy
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Student Attendance & Learning Portal
          </p>
        </div>

        {/* Student Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="text-center pb-2 border-b border-slate-800/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <GraduationCap className="w-4 h-4" />
              <span>Student Account Login</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Sign in with your Mobile Number or Roll Number
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          <form onSubmit={handleStudentLogin} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mobile Number or Roll No *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="e.g. 9876543210 or SSSAM-101"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
            </button>

          </form>

          {/* Create New Account Button & Download App Link */}
          <div className="pt-3 border-t border-slate-800/80 text-center space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/register"
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Create Account</span>
              </Link>

              <Link
                href="/download"
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-indigo-900/60 to-blue-900/60 hover:from-indigo-800/80 hover:to-blue-800/80 text-blue-300 hover:text-white border border-indigo-500/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>📱 Download App</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          SSSAM Portal &copy; {new Date().getFullYear()}
        </p>

      </div>

    </div>
  );
}
