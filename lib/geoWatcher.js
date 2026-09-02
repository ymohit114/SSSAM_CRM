/**
 * SSSAM Geofence Entry & Exit Watcher
 * Enhanced with Browser Background Keep-Alive & Instant Reactive Focus Wakeup
 */

import { calculateDistance } from './geo';
import { sendLocalNotification, cancelLocalNotifications } from './notifications';
import { startBrowserBackgroundGps, stopBrowserBackgroundGps } from './backgroundGpsKeeper';

let watchInterval = null;
let hasTriggeredExitAlerts = false;
let hasTriggeredEntryAlert = false;

const EXIT_ALERT_IDS = [9001, 9002, 9003];
const ENTRY_ALERT_ID = 8001;

/**
 * Start watching student location
 */
export function startGeofenceWatcher({
  studentId,
  studentName,
  instituteLat,
  instituteLng,
  geofenceRadius = 25,
  isPunchedIn = false,
  isPunchedOut = false
}) {
  // If already punched out for the day, no need to monitor
  if (isPunchedOut) {
    stopGeofenceWatcher();
    return;
  }

  const exitDistanceThreshold = geofenceRadius + 20; // 20 meters beyond geofence boundary

  const evaluatePosition = async (pos) => {
    if (!pos || !pos.coords) return;
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const distance = calculateDistance(userLat, userLng, instituteLat, instituteLng);

    // ==========================================
    // SCENARIO 1: STUDENT ARRIVED ON CAMPUS (ENTRY ALERT)
    // Student is inside 25m perimeter BUT hasn't punched in yet
    // ==========================================
    if (!isPunchedIn && !isPunchedOut) {
      if (distance <= geofenceRadius) {
        const todayStr = new Date().toISOString().split('T')[0];
        const storedEntryNotice = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`entry_notified_${studentId}_${todayStr}`) : null;

        if (!hasTriggeredEntryAlert && !storedEntryNotice) {
          hasTriggeredEntryAlert = true;
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`entry_notified_${studentId}_${todayStr}`, 'true');
          }

          console.log("📍 Student arrived inside campus! Sending Arrival Punch In Alert...");

          await sendLocalNotification({
            id: ENTRY_ALERT_ID,
            title: "📍 Welcome to SSSAM Academy!",
            body: `Hello ${studentName || 'Student'}, you are inside the campus! Please tap here to PUNCH IN and mark your attendance.`,
            extra: { action: 'punch_in', studentId }
          });
        }
      } else {
        if (distance > geofenceRadius + 30) {
          hasTriggeredEntryAlert = false;
        }
      }
    }

    // ==========================================
    // SCENARIO 2: STUDENT LEFT CAMPUS WITHOUT PUNCH OUT (EXIT ALERT)
    // Student is punched in BUT exited > 45m from campus
    // ==========================================
    if (isPunchedIn && !isPunchedOut) {
      if (distance > exitDistanceThreshold) {
        if (!hasTriggeredExitAlerts) {
          hasTriggeredExitAlerts = true;
          console.log("🚨 Student exited without punch out! Scheduling 3 consecutive alerts...");

          const now = new Date();
          const in2Mins = new Date(now.getTime() + 2 * 60 * 1000);
          const in5Mins = new Date(now.getTime() + 5 * 60 * 1000);

          // Alert 1 (Immediate)
          await sendLocalNotification({
            id: 9001,
            title: "⚠️ Punch Out Reminder (1/3)",
            body: `Hello ${studentName || 'Student'}, you left the academy campus without punching out! Please submit your daily study log to record today's attendance.`,
            extra: { action: 'punch_out', studentId }
          });

          // Alert 2 (After 2 Minutes)
          await sendLocalNotification({
            id: 9002,
            title: "⚠️ Punch Out Reminder (2/3)",
            body: `Your attendance timer is still running. Please open the app and tap 'Punch Out' with your study summary.`,
            scheduleAt: in2Mins,
            extra: { action: 'punch_out', studentId }
          });

          // Alert 3 (After 5 Minutes)
          await sendLocalNotification({
            id: 9003,
            title: "⚠️ SSSAM Final Alert (3/3)",
            body: `Final reminder: Please punch out now to record your exact study hours at SSSAM Academy.`,
            scheduleAt: in5Mins,
            extra: { action: 'punch_out', studentId }
          });
        }
      } else {
        if (hasTriggeredExitAlerts) {
          console.log("🔙 Student returned to campus. Resetting exit trigger...");
          hasTriggeredExitAlerts = false;
          cancelLocalNotifications(EXIT_ALERT_IDS);
        }
      }
    }
  };

  // 1. Start browser background keep-alive & hardware watcher
  startBrowserBackgroundGps({
    onPosition: evaluatePosition,
    onError: (err) => console.log('Background GPS error note:', err.message),
    enableKeepAliveAudio: true
  });

  // 2. Clear previous interval if any
  if (watchInterval) {
    clearInterval(watchInterval);
  }

  // 3. Fallback interval check every 15 seconds
  watchInterval = setInterval(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        evaluatePosition,
        (err) => console.log('Interval GPS check note:', err.message),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, 15000);
}

/**
 * Stop watcher and clear all pending notifications
 */
export function stopGeofenceWatcher() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
  hasTriggeredExitAlerts = false;
  hasTriggeredEntryAlert = false;
  stopBrowserBackgroundGps();
  cancelLocalNotifications([...EXIT_ALERT_IDS, ENTRY_ALERT_ID]);
  console.log("🛑 Geofence Watcher stopped.");
}
