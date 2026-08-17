'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FileSpreadsheet, Settings,
  Shield, LogOut, Radio, Clock, Lock, KeyRound, ArrowLeft, Menu, X, ShieldAlert, User
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form states for inline admin login fallback
  const [email, setEmail] = useState('admin@mohit.com');
  const [password, setPassword] = useState('1234567890');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check admin auth from localStorage & sessionStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sssam_admin');
      if (stored) {
        const userObj = JSON.parse(stored);
        if (userObj && userObj.role === 'admin') {
          setAdminUser(userObj);
        }
      }
    } catch (err) {
      console.error('Admin auth check error:', err);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');

      setAdminUser(data.user);
      localStorage.setItem('sssam_admin', JSON.stringify(data.user));
      sessionStorage.setItem('sssam_admin_auth', 'true');
    } catch (err) {
      setLoginError(err.message || 'Login failed. Use admin@mohit.com / 1234567890');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('sssam_admin');
    sessionStorage.removeItem('sssam_admin_auth');
    router.push('/login?role=admin');
  };

  const navItems = [
    { label: 'Overview & Live Feed', href: '/admin', icon: LayoutDashboard },
    { label: 'Student Directory', href: '/admin/students', icon: Users },
    { label: 'Reports & Export', href: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Settings & App Updates', href: '/admin/settings', icon: Settings },
  ];

  // If not authenticated, show Admin Login Card
  if (authChecked && !adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
        
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative z-10">
          
          {/* Logo & Institute Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shadow-indigo-600/30 flex items-center justify-center mx-auto overflow-hidden">
              <img src="/logo.png" alt="SSSAM Logo" width={56} height={56} className="w-14 h-14 object-contain" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">SSSAM Academy</h1>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mt-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin & Faculty Login</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Sign in with your admin credentials to access workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Admin Email / Username *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="admin@mohit.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Admin Password *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="••••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-0.5">
                <div><strong>Email:</strong> <code className="text-indigo-300">admin@mohit.com</code></div>
                <div><strong>Password:</strong> <code className="text-indigo-300">1234567890</code></div>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? 'Signing In...' : 'Unlock Admin Portal'}</span>
            </button>

          </form>

          {/* Back to Student Kiosk */}
          <div className="text-center pt-2 border-t border-slate-800/80">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Student Portal</span>
            </Link>
          </div>

        </div>

      </div>
    );
  }

  // Authenticated Admin Shell with Sidebar
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-600 selection:text-white">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900/90 border-r border-slate-800 p-5 space-y-6 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-lg shadow-indigo-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/logo.png" alt="SSSAM Logo" width={36} height={36} className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">SSSAM Academy</h2>
            <p className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Admin Workspace</span>
            </p>
          </div>
        </div>

        {/* Admin user card */}
        <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            {adminUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{adminUser?.name || 'Mohit Yadav'}</div>
            <div className="text-[10px] text-slate-400 truncate">{adminUser?.email || 'admin@mohit.com'}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs lg:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/60 transition-all"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Student Portal</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Logout</span>
          </button>

        </div>

      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="SSSAM" width={28} height={28} className="w-7 h-7 object-contain" />
          </div>
          <div>
            <span className="font-bold text-white text-xs block leading-tight">SSSAM Academy</span>
            <span className="text-[10px] text-indigo-400 font-semibold">Admin Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-lg flex items-center gap-1"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Kiosk</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/98 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 z-50 sticky top-[53px] shadow-2xl animate-fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
            >
              Go to Kiosk
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 py-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs font-bold text-rose-300"
            >
              Lock & Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Page Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Top Desktop Bar with Clock */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold text-slate-300">Live Campus Geofence Active (25m)</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 font-mono text-white">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 py-1.5 px-3 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 text-xs font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
