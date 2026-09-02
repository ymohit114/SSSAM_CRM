/**
 * SSSAM Background GPS & Mobile Browser Keep-Alive Engine
 * Solves the issue of mobile browsers (Chrome / Safari) pausing GPS in background / locked screen.
 * 
 * Techniques:
 * 1. Screen Wake Lock API (prevents CPU sleep during attendance/sessions)
 * 2. Web Audio / Silent Audio Keep-Alive Loop (keeps background JS & Geolocation thread alive)
 * 3. Instant Reactive Geolocation Wakeup (0ms fresh GPS poll on visibility change/screen unlock)
 * 4. Hardware GPS Watcher (watchPosition with maximumAge: 0)
 */

let wakeLock = null;
let watchId = null;
let audioContext = null;
let silentOscillator = null;
let isKeepAliveActive = false;

/**
 * Start browser background GPS keep-alive
 */
export function startBrowserBackgroundGps({
  onPosition,
  onError,
  enableKeepAliveAudio = true
} = {}) {
  if (typeof window === 'undefined') return;

  stopBrowserBackgroundGps();
  isKeepAliveActive = true;

  // 1. Request Screen Wake Lock if supported
  requestWakeLock();

  // 2. Start Inaudible Silent Audio Loop to keep Chrome / Safari background thread alive
  if (enableKeepAliveAudio) {
    startSilentAudioKeepAlive();
  }

  // 3. Hardware GPS Watcher (Higher priority than polling intervals)
  if (navigator.geolocation) {
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (onPosition) onPosition(pos);
        },
        (err) => {
          console.warn('Background GPS Watcher note:', err.message);
          if (onError) onError(err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
    } catch (e) {
      console.warn('Failed to start watchPosition:', e);
    }
  }

  // 4. Instant Wakeup on Visibility Change / Screen Unlock
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 Browser Tab focused / Screen unlocked: Triggering instant GPS refresh...');
      // Re-request wake lock if dropped
      requestWakeLock();
      // Force immediate 0ms fresh GPS read
      forceInstantGpsRefresh(onPosition);
    }
  };

  const handleFocus = () => {
    forceInstantGpsRefresh(onPosition);
  };

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleFocus);

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
}

/**
 * Force immediate fresh GPS position read (0ms maximumAge)
 */
export function forceInstantGpsRefresh(onPosition) {
  if (typeof window === 'undefined' || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (onPosition) onPosition(pos);
    },
    (err) => {
      console.warn('Instant GPS refresh note:', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

/**
 * Request Screen Wake Lock to prevent CPU sleep
 */
async function requestWakeLock() {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
  try {
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
      console.log('⚡ Screen Wake Lock active.');
    }
  } catch (err) {
    console.warn('Wake Lock request note:', err.message);
  }
}

/**
 * Starts an inaudible, silent audio oscillator loop.
 * Browsers allow active media tabs to run background Geolocation and timers continuously.
 */
function startSilentAudioKeepAlive() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    if (!silentOscillator) {
      // Create oscillator at inaudible frequency (20Hz) with 0 gain (silent)
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(20, audioContext.currentTime); // Inaudible
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime); // Near-zero/inaudible volume

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start();
      silentOscillator = osc;
      console.log('🎵 Background Keep-Alive Audio loop active.');
    }
  } catch (err) {
    console.warn('Silent audio keep-alive note:', err.message);
  }
}

/**
 * Stop background GPS and release all locks
 */
export function stopBrowserBackgroundGps() {
  isKeepAliveActive = false;

  // 1. Clear watch position
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  // 2. Release wake lock
  if (wakeLock) {
    try {
      wakeLock.release();
    } catch (e) {}
    wakeLock = null;
  }

  // 3. Stop silent audio
  if (silentOscillator) {
    try {
      silentOscillator.stop();
      silentOscillator.disconnect();
    } catch (e) {}
    silentOscillator = null;
  }

  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
}
