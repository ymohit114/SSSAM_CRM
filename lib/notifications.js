/**
 * SSSAM Academy Notification Service
 * Handles Android Native Local Notifications, Push Notifications, and Web Notifications
 */

let isLocalNotificationsInitialized = false;

export async function initNotifications() {
  if (typeof window === 'undefined') return;

  // 1. If running inside Capacitor Native Mobile App
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Request permission
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Create standard and urgent notification channels for Android
      try {
        await LocalNotifications.createChannel({
          id: 'sssam_alerts',
          name: 'SSSAM Academy Alerts',
          description: 'High-priority attendance and fee notifications',
          importance: 5, // Max importance
          visibility: 1, // Public on lockscreen
          vibration: true,
          sound: 'default'
        });
      } catch (channelErr) {
        console.log('Notification channel create log:', channelErr);
      }

      isLocalNotificationsInitialized = true;
      console.log('✅ SSSAM Native Local Notifications Initialized');
    } catch (err) {
      console.warn('LocalNotifications init error:', err);
    }

    // Initialize Push Notifications if available
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const pushStatus = await PushNotifications.checkPermissions();
      if (pushStatus.receive !== 'granted') {
        await PushNotifications.requestPermissions();
      }
      await PushNotifications.register();
    } catch (pushErr) {
      console.log('PushNotifications init log:', pushErr);
    }
  } else {
    // 2. Web Browser Notification permission request
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.log('Web notification permission log:', e);
      }
    }
  }
}

/**
 * Send an immediate or scheduled local notification
 */
export async function sendLocalNotification({
  id = Date.now() % 100000,
  title,
  body,
  scheduleAt = null,
  extra = {}
}) {
  if (typeof window === 'undefined') return false;

  // 1. Try Native Capacitor Local Notification first
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const notificationConfig = {
        id: Number(id),
        title,
        body,
        channelId: 'sssam_alerts',
        extra,
        smallIcon: 'ic_launcher',
        iconColor: '#3B82F6'
      };

      if (scheduleAt && scheduleAt instanceof Date) {
        notificationConfig.schedule = { at: scheduleAt };
      }

      await LocalNotifications.schedule({
        notifications: [notificationConfig]
      });

      console.log(`🔔 Native notification sent [ID: ${id}]:`, title);
      return true;
    } catch (err) {
      console.warn('Native notification error, falling back:', err);
    }
  }

  // 2. Web Browser Fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if (scheduleAt && scheduleAt instanceof Date) {
        const delayMs = Math.max(0, scheduleAt.getTime() - Date.now());
        setTimeout(() => {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            data: extra
          });
        }, delayMs);
      } else {
        new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          data: extra
        });
      }
      return true;
    } catch (e) {
      console.log('Web notification display log:', e);
    }
  }

  return false;
}

/**
 * Cancel pending scheduled notifications by ID
 */
export async function cancelLocalNotifications(ids = []) {
  if (typeof window === 'undefined' || !ids.length) return;

  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: ids.map(id => ({ id: Number(id) }))
      });
      console.log('🔕 Cancelled notifications:', ids);
    } catch (err) {
      console.warn('Error cancelling local notifications:', err);
    }
  }
}
