'use client';

import React, { useEffect, useRef } from 'react';

export default function GeofenceMap({
  instituteLat,
  instituteLng,
  instituteRadius = 50,
  instituteName = "SSSAM Academy",
  userLat,
  userLng,
  userAccuracy,
  isInside = false,
  distance = 0
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    instituteMarker: null,
    geofenceCircle: null,
    userMarker: null,
    userAccuracyCircle: null,
    distanceLine: null
  });

  useEffect(() => {
    if (!mapContainerRef.current || typeof window === 'undefined') return;

    let L;
    let isMounted = true;

    async function initMap() {
      L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Initialize Map
      if (!mapInstanceRef.current) {
        const centerLat = instituteLat || 28.6139;
        const centerLng = instituteLng || 77.2090;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 18,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          subdomains: 'abcd',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const layers = layersRef.current;

      // Clean old layers
      if (layers.instituteMarker) map.removeLayer(layers.instituteMarker);
      if (layers.geofenceCircle) map.removeLayer(layers.geofenceCircle);
      if (layers.userMarker) map.removeLayer(layers.userMarker);
      if (layers.userAccuracyCircle) map.removeLayer(layers.userAccuracyCircle);
      if (layers.distanceLine) map.removeLayer(layers.distanceLine);

      // 1. Institute Marker & Circle
      if (instituteLat && instituteLng) {
        const instituteIcon = L.divIcon({
          className: 'custom-inst-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-base font-bold shadow-blue-500/50">
                🏛️
              </div>
              <div class="absolute -bottom-6 bg-slate-900/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap border border-blue-500/30">
                ${instituteName}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        layers.instituteMarker = L.marker([instituteLat, instituteLng], { icon: instituteIcon })
          .addTo(map)
          .bindPopup(`<b>${instituteName}</b><br>Allowed Punch Radius: ${instituteRadius}m`);

        layers.geofenceCircle = L.circle([instituteLat, instituteLng], {
          radius: instituteRadius,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4'
        }).addTo(map);
      }

      // 2. User Marker & Line
      if (userLat && userLng) {
        const userPinBg = isInside ? 'bg-emerald-500' : 'bg-rose-500';
        const userBorder = isInside ? 'border-emerald-200' : 'border-rose-200';
        const userGlow = isInside ? 'shadow-emerald-500/50' : 'shadow-rose-500/50';

        const userIcon = L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-10 w-10 rounded-full ${userPinBg} opacity-40 animate-ping"></span>
              <div class="w-8 h-8 rounded-full ${userPinBg} border-2 ${userBorder} shadow-lg flex items-center justify-center text-white text-xs font-bold ${userGlow}">
                👤
              </div>
              <div class="absolute -bottom-6 ${isInside ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/90 border-rose-500/40 text-rose-300'} text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap border">
                ${isInside ? 'Inside Campus' : `${Math.round(distance)}m Away`}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        layers.userMarker = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup(`<b>Your GPS Location</b><br>Distance: ${Math.round(distance)}m<br>Status: ${isInside ? 'Inside 50m Allowed Zone ✅' : 'Outside Campus ❌'}`);

        if (userAccuracy && userAccuracy < 100) {
          layers.userAccuracyCircle = L.circle([userLat, userLng], {
            radius: userAccuracy,
            color: isInside ? '#10b981' : '#f43f5e',
            fillOpacity: 0.05,
            weight: 1
          }).addTo(map);
        }

        if (instituteLat && instituteLng) {
          layers.distanceLine = L.polyline([
            [userLat, userLng],
            [instituteLat, instituteLng]
          ], {
            color: isInside ? '#10b981' : '#f43f5e',
            weight: 2,
            dashArray: '5, 5',
            opacity: 0.8
          }).addTo(map);

          const bounds = L.latLngBounds([
            [userLat, userLng],
            [instituteLat, instituteLng]
          ]);
          map.fitBounds(bounds.pad(0.4), { maxZoom: 19 });
        }
      } else if (instituteLat && instituteLng) {
        map.setView([instituteLat, instituteLng], 18);
      }

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [instituteLat, instituteLng, instituteRadius, instituteName, userLat, userLng, isInside, distance, userAccuracy]);

  return (
    <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-blue-300"></span>
          <span className="text-slate-300 text-[11px] font-medium">{instituteRadius}m Campus Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isInside ? 'bg-emerald-500' : 'bg-rose-500'} inline-block`}></span>
          <span className="text-slate-300 text-[11px] font-medium">You ({isInside ? 'Inside' : 'Outside'})</span>
        </div>
      </div>
    </div>
  );
}
