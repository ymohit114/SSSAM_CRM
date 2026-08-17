/**
 * Calculate distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 999999;
  }

  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Checks if a given position is within the allowed geofence radius.
 */
export function isWithinGeofence(userLat, userLng, targetLat, targetLng, maxRadiusMeters = 50) {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return {
    isWithin: distance <= maxRadiusMeters,
    distance,
    maxRadiusMeters,
    difference: distance - maxRadiusMeters
  };
}

/**
 * Get current user position using Capacitor native Geolocation or HTML5 fallback.
 * Automatically requests permissions on first call.
 */
export async function getCurrentPosition() {
  // Check if running inside Capacitor native mobile app
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      // Request permission prompt natively
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          throw new Error("Location permission denied. Please allow location access to mark attendance.");
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 0),
        timestamp: position.timestamp
      };
    } catch (capErr) {
      console.warn("Capacitor geolocation fallback:", capErr);
      // Fall through to browser geolocation if capacitor fails
    }
  }

  // Web Browser Geolocation fallback
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    // Try high accuracy first (outdoor GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
          timestamp: position.timestamp
        });
      },
      (error) => {
        // Fallback: If high accuracy timed out or unavailable, try standard network/cellular location
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                latitude: fallbackPos.coords.latitude,
                longitude: fallbackPos.coords.longitude,
                accuracy: Math.round(fallbackPos.coords.accuracy || 0),
                timestamp: fallbackPos.timestamp
              });
            },
            () => {
              reject(new Error("GPS signal unavailable. Please turn ON device GPS/Location."));
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
          );
          return;
        }

        let msg = "Could not obtain location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location permission was denied. Please allow location access to punch attendance.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable. Please check your device GPS.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please tap 'Refresh GPS Location'.";
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  });
}

export function formatDistance(meters) {
  if (meters == null || meters === 999999) return "Calculating...";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} meters`;
}
