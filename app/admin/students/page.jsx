'use client';

import React, { useState, useEffect } from 'react';
import StudentManager from '@/components/StudentManager';
import { fetchWithAuth } from '@/lib/apiClient';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);

  const loadData = async () => {
    try {
      const stdRes = await fetchWithAuth('/api/students').then(r => r.json());
      if (stdRes.students) setStudents(stdRes.students);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <StudentManager
      students={students}
      onRefresh={loadData}
    />
  );
}
