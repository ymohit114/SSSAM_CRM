'use client';

import React, { useState, useEffect } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import { fetchWithAuth } from '@/lib/apiClient';

export default function AdminOverviewPage() {
  const [institute, setInstitute] = useState(null);
  const [students, setStudents] = useState([]);

  const loadData = async () => {
    try {
      const [instRes, stdRes] = await Promise.all([
        fetchWithAuth('/api/settings').then(r => r.json()),
        fetchWithAuth('/api/students').then(r => r.json())
      ]);

      if (instRes.settings) setInstitute(instRes.settings);
      if (stdRes.students) setStudents(stdRes.students);
    } catch (err) {
      console.error('Error loading admin overview data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminDashboard
      institute={institute}
      students={students}
    />
  );
}
