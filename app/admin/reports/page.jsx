'use client';

import React, { useState, useEffect } from 'react';
import AttendanceReports from '@/components/AttendanceReports';
import { fetchWithAuth } from '@/lib/apiClient';

export default function AdminReportsPage() {
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
      console.error('Error loading reports data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AttendanceReports
      institute={institute}
      students={students}
    />
  );
}
