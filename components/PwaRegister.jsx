'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('⚡ SSSAM ServiceWorker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.log('ServiceWorker registration note:', err.message);
        });

      // Request Web Notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            console.log('Web Notification permission:', permission);
          });
        }, 3000);
      }
    }
  }, []);

  return null;
}
