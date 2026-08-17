'use client';

import React, { useState, useEffect } from 'react';
import InstituteSettings from '@/components/InstituteSettings';

export default function AdminSettingsPage() {
  const [institute, setInstitute] = useState(null);

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
    <InstituteSettings
      institute={institute}
      onSettingsSaved={(updated) => setInstitute(updated)}
    />
  );
}
