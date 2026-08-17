/**
 * SSSAM Geofence Exit Watcher
 * Detects if a student left the academy (> 20m from geofence) without punching out
 * and fires 3 sequential notifications.
 */

import { calculateDistance } from './geo';
import { sendLocalNotification, cancelLocalNotifications } from './notifications';

let watchInterval = null;
let hasTriggeredExitAlerts = false;
const EXIT_ALERT_IDS = [9001, 9002, 9003];

/**
 * Start watching student location while punched in
 */
export function startGeofenceWatcher({
  studentId,
  studentName,
  instituteLat,
  instituteLng,
  geofenceRadius = 50,
  isPunchedIn = false,
  isPunchedOut = false
}) {
  stopGeofenceWatcher(); // Clear any existing watchers

  if (!isPunchedIn || isPunchedOut) {
    return;
  }

  hasTriggeredExitAlerts = false;
  const exitDistanceThreshold = geofenceRadius + 20; // 20 meters beyond geofence boundary

  const checkPosition = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const distance = calculateDistance(userLat, userLng, instituteLat, instituteLng);

        console.log(`📡 Geofence Watcher: Distance = ${Math.round(distance)}m (Exit Limit = ${exitDistanceThreshold}m)`);

        // Case 1: Student is outside campus (> 20m) and hasn't punched out
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
          // Case 2: Student came back inside campus
          if (hasTriggeredExitAlerts) {
            console.log("🔙 Student returned to campus. Resetting exit trigger...");
            hasTriggeredExitAlerts = false;
            cancelLocalNotifications(EXIT_ALERT_IDS);
          }
        }
      },
      (err) => {
        console.log("Geofence watcher position err:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Run initial check and set periodic watcher every 20 seconds
  checkPosition();
  watchInterval = setInterval(checkPosition, 20000);
}

/**
 * Stop watcher and clear all pending exit notifications
 */
export function stopGeofenceWatcher() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
  hasTriggeredExitAlerts = false;
  cancelLocalNotifications(EXIT_ALERT_IDS);
  console.log("🛑 Geofence Watcher stopped & pending exit alerts cleared.");
}
