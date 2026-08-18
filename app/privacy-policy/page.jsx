'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, MapPin, Bell, User } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-black selection:text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to SSSAM Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500">
                Last updated: August 18, 2026 • SSSAM Academy
              </p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <section className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>SSSAM Academy</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how our mobile application and web portal (<strong>SSSAM Portal</strong>) collects, uses, and safeguards information when you use our services.
          </p>
        </section>

        {/* 1. Location Data */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
            <MapPin className="w-4 h-4 text-black flex-shrink-0" />
            <h2>1. Location Information (GPS & Geofencing)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Our application collects precise and approximate location data (<strong>ACCESS_FINE_LOCATION</strong> and <strong>ACCESS_COARSE_LOCATION</strong>) solely for the purpose of <strong>verifying that student attendance punches occur within the designated 25-meter campus boundary</strong> of SSSAM Academy.
          </p>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>• Location coordinates are captured only at the instant you initiate a Punch In or Punch Out action, and periodically while on campus to send arrival / departure reminders.</p>
            <p>• We do not track your real-time whereabouts outside the academy or share your GPS data with any third parties or advertisers.</p>
          </div>
        </section>

        {/* 2. Personal Information */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
            <User className="w-4 h-4 text-black flex-shrink-0" />
            <h2>2. Personal & Account Information</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            When you register or are enrolled by our institute administration, we store basic profile details including your:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1 pl-2">
            <li>Full Name</li>
            <li>Student Roll Number</li>
            <li>Mobile Phone Number</li>
            <li>Email Address</li>
            <li>Enrolled Course & Fee Schedule Details</li>
          </ul>
        </section>

        {/* 3. Notifications */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
            <Bell className="w-4 h-4 text-black flex-shrink-0" />
            <h2>3. Local Push Notifications</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            We use notification permissions to deliver essential utility alerts such as:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1 pl-2">
            <li>Daily attendance Punch In / Punch Out confirmations</li>
            <li>Campus arrival and exit reminders</li>
            <li>Scheduled fee installment due date notices</li>
          </ul>
        </section>

        {/* 4. Data Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
            <Lock className="w-4 h-4 text-black flex-shrink-0" />
            <h2>4. Data Security & Retention</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            All communication between the application and our servers is secured using industry-standard SSL encryption (HTTPS). Your attendance records and course details are retained securely in our institute database for institutional academic and accounting records.
          </p>
        </section>

        {/* 5. Contact Us */}
        <section className="border-t border-slate-200 pt-6 space-y-2 text-xs sm:text-sm text-slate-700">
          <h3 className="font-bold text-slate-900">Contact Us</h3>
          <p>
            If you have any questions regarding this Privacy Policy or your data, please contact the institute office:
          </p>
          <p className="font-medium text-slate-900">
            <strong>SSSAM Academy</strong><br />
            Ground Floor, M-24, near SBI Bank, Block M, Old DLF Colony, Sector 14, Gurugram, Haryana 122001<br />
            Email: <span className="font-mono">admin@mohit.com</span>
          </p>
        </section>

      </div>
    </div>
  );
}
