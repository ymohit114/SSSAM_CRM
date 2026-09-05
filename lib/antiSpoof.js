/**
 * Anti-Spoofing & Anti-Tampering Security Utility for SSSAM CRM
 * Protects against Chrome DevTools Sensors location override, fake GPS, and client inspection.
 */

export function initAntiTampering({ onViolation, onRestore }) {
  if (typeof window === 'undefined') return () => {};

  let isDevToolsDetected = false;

  // 1. Block DevTools Keyboard Shortcuts & Context Menu
  const handleKeyDown = (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      triggerAlert('F12 Developer Tools shortcut is disabled for attendance security.');
      return false;
    }

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    // Ctrl+Shift+J / Cmd+Option+J (Console)
    // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
    // Ctrl+U / Cmd+U (View Source)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'I' || e.key === 'i' ||
       e.key === 'J' || e.key === 'j' ||
       e.key === 'C' || e.key === 'c' ||
       e.key === 'U' || e.key === 'u' ||
       e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67 || e.keyCode === 85)
    ) {
      e.preventDefault();
      e.stopPropagation();
      triggerAlert('Developer tools inspection is disabled on attendance portal.');
      return false;
    }
  };

  const handleContextMenu = (e) => {
    // Prevent right click inspect menu on student attendance screen
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return; // allow copy/paste in text inputs
    }
    e.preventDefault();
  };

  const triggerAlert = (reason) => {
    isDevToolsDetected = true;
    if (onViolation) onViolation(reason);
  };

  // 2. Active DevTools Detection by Window Disparity & Timing
  const checkDevTools = () => {
    try {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      // Note: On regular desktop browsers, opening DevTools dock changes inner vs outer dimensions significantly
      if (widthThreshold || heightThreshold) {
        if (!isDevToolsDetected) {
          isDevToolsDetected = true;
          if (onViolation) {
            onViolation('Developer Tools window is currently open. Location emulation may be active.');
          }
        }
        return;
      }

      // Timing check
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      (function() { return false; }['constructor']('debugger')());
      const duration = performance.now() - start;

      if (duration > 100) {
        if (!isDevToolsDetected) {
          isDevToolsDetected = true;
          if (onViolation) {
            onViolation('Debugger / DevTools active. Attendance punching is locked.');
          }
        }
        return;
      }

      if (isDevToolsDetected) {
        isDevToolsDetected = false;
        if (onRestore) onRestore();
      }
    } catch {
      // Ignore
    }
  };

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('contextmenu', handleContextMenu, true);

  const intervalId = setInterval(checkDevTools, 1500);

  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('contextmenu', handleContextMenu, true);
    clearInterval(intervalId);
  };
}

/**
 * Validates GPS position integrity to detect Sensors / Mock Location simulation.
 */
export function checkLocationIntegrity(gpsPosition) {
  if (!gpsPosition) return { isTampered: false, reason: null };

  try {
    // 1. Webdriver automated browser check
    if (typeof navigator !== 'undefined' && navigator.webdriver) {
      return {
        isTampered: true,
        reason: 'Automated browser / WebDriver detected. Punching disabled.'
      };
    }

    // 2. Timezone verification for Indian geofence
    // SSSAM Academy is in Gurugram, India (IST UTC+5:30)
    const timezoneOffset = new Date().getTimezoneOffset(); // -330 for IST
    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // If client timezone offset is far from India (-330 minutes), e.g. Europe/Moscow or America
    if (timezoneOffset !== -330 && !clientTz.includes('Calcutta') && !clientTz.includes('Kolkata') && !clientTz.includes('Asia/Colombo')) {
      return {
        isTampered: true,
        reason: `Mismatched Timezone (${clientTz}). Real physical campus attendance requires device to be in Indian Standard Time (IST).`
      };
    }

    // 3. DevTools Sensors default simulated accuracy check
    // In Chrome DevTools Sensors, default simulated accuracy is exactly 150
    if (gpsPosition.accuracy === 150 && typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform()) {
      return {
        isTampered: true,
        reason: 'Simulated GPS accuracy signature detected (Chrome DevTools Sensors). Real device GPS required.'
      };
    }

    return { isTampered: false, reason: null };
  } catch {
    return { isTampered: false, reason: null };
  }
}
