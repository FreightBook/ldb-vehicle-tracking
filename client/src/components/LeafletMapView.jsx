import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Maximize2,
  Minimize2,
  Layers,
  Plus,
  Minus,
  Navigation,
  Truck,
  ArrowLeft,
  Eye,
  Menu,
  FileDown,
} from 'lucide-react';
import { exportTruckReportToPdf } from '../utils/pdfExport';
import { findCity } from '../utils/indianCities';

function getCoords(coordsObj, fallbackQuery) {
  if (coordsObj && typeof coordsObj.lat === 'number' && typeof coordsObj.lng === 'number') {
    return [coordsObj.lat, coordsObj.lng];
  }
  if (fallbackQuery && typeof fallbackQuery === 'string') {
    const city = findCity(fallbackQuery);
    if (city && typeof city.lat === 'number' && typeof city.lng === 'number') {
      return [city.lat, city.lng];
    }
  }
  return null;
}

export default function LeafletMapView({
  trip,
  events = [],
  allTrips = [],
  activeCount = 0,
  onSelectTrip,
  onClearSelection,
  onOpenTimeline,
  onOpenMobileSidebar,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayersRef = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileLayerType, setTileLayerType] = useState('esri'); // 'esri' | 'osm'

  // Helper to attach tile layers
  const setMapTiles = (map, type) => {
    tileLayersRef.current.forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    tileLayersRef.current = [];

    if (type === 'esri') {
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      ).addTo(map);

      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 16,
        }
      ).addTo(map);

      tileLayersRef.current = [base, labels];
    } else {
      const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      tileLayersRef.current = [osm];
    }
  };

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      setMapTiles(map, 'esri');
      mapInstanceRef.current = map;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer if changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    setMapTiles(mapInstanceRef.current, tileLayerType);
  }, [tileLayerType]);

  // Main rendering effect: renders either Single Vehicle Route or Fleet Overview
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // =========================================================================
    // MODE 1: SINGLE VEHICLE FOCUS (Trip is selected)
    // =========================================================================
    if (trip) {
      const geoEvents = events
        .filter((e) => typeof e.locLat === 'number' && typeof e.locLong === 'number')
        .sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));

      const originCoords = getCoords(trip.originCoords, trip.origin);
      const destCoords = getCoords(trip.destinationCoords, trip.destination);

      const allBoundsPoints = [];

      // 1. ADD FROM (ORIGIN) MARKER
      if (originCoords) {
        allBoundsPoints.push(originCoords);
        const originShort =
          (trip.origin || 'Origin')
            .split(',')[0]
            .replace(/\(.*?\)/g, '')
            .trim() || 'Origin';

        const originIconHtml = `
          <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
            <div style="background: #059669; color: #ffffff; padding: 2.5px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; letter-spacing: 0.3px; white-space: nowrap; box-shadow: 0 3px 6px rgba(0,0,0,0.25); border: 1.5px solid #ffffff; display: flex; align-items: center; gap: 4px;">
              <span style="background: #ffffff; color: #059669; border-radius: 3px; font-size: 8px; font-weight: 900; padding: 1px 3px;">FROM</span>
              <span>${originShort}</span>
            </div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; margin-top: 2px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #059669;"></div>
          </div>
        `;

        const originIcon = L.divIcon({
          className: 'custom-origin-marker',
          html: originIconHtml,
          iconSize: [30, 48],
          iconAnchor: [0, 0],
        });

        const originMarker = L.marker(originCoords, { icon: originIcon }).addTo(group);
        originMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 220px;">
            <div style="background: #059669; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>🟢 TRIP ORIGIN (FROM)</span>
              <span style="font-size: 9px; background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 3px;">START</span>
            </div>
            <div style="color: #1e293b; font-weight: bold; font-size: 13px; margin-bottom: 3px;">
              ${trip.origin || 'Trip Origin'}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">
              <strong>Vehicle:</strong> ${trip.vehicleNumber}
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
              GPS: ${originCoords[0].toFixed(5)}, ${originCoords[1].toFixed(5)}
            </div>
          </div>
        `);
      }

      // 2. ADD TO (DESTINATION) MARKER
      if (destCoords) {
        allBoundsPoints.push(destCoords);
        const destShort =
          (trip.destination || 'Destination')
            .split(',')[0]
            .replace(/\(.*?\)/g, '')
            .trim() || 'Destination';

        const destIconHtml = `
          <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">
            <div style="background: #0284c7; color: #ffffff; padding: 2.5px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; letter-spacing: 0.3px; white-space: nowrap; box-shadow: 0 3px 6px rgba(0,0,0,0.25); border: 1.5px solid #ffffff; display: flex; align-items: center; gap: 4px;">
              <span style="background: #ffffff; color: #0284c7; border-radius: 3px; font-size: 8px; font-weight: 900; padding: 1px 3px;">TO</span>
              <span>${destShort}</span>
            </div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; margin-top: 2px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0284c7;"></div>
          </div>
        `;

        const destIcon = L.divIcon({
          className: 'custom-destination-marker',
          html: destIconHtml,
          iconSize: [30, 48],
          iconAnchor: [0, 0],
        });

        const destMarker = L.marker(destCoords, { icon: destIcon }).addTo(group);
        destMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 220px;">
            <div style="background: #0284c7; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>🏁 DESTINATION (TO)</span>
              <span style="font-size: 9px; background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 3px;">END</span>
            </div>
            <div style="color: #1e293b; font-weight: bold; font-size: 13px; margin-bottom: 3px;">
              ${trip.destination || 'Trip Destination'}
            </div>
            ${
              trip.estimatedDistanceKm
                ? `<div style="color: #059669; font-weight: bold; font-size: 11px; margin-bottom: 2px;">Route Distance: ~${trip.estimatedDistanceKm} km</div>`
                : ''
            }
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
              GPS: ${destCoords[0].toFixed(5)}, ${destCoords[1].toFixed(5)}
            </div>
          </div>
        `);
      }

      // 3. TOLL PLAZAS AND CONNECTING ROUTE LINES
      if (geoEvents.length > 0) {
        geoEvents.forEach((e) => allBoundsPoints.push([e.locLat, e.locLong]));

        // Segment A: Dashed line from Origin to First Toll
        if (originCoords) {
          L.polyline([originCoords, [geoEvents[0].locLat, geoEvents[0].locLong]], {
            color: '#059669',
            weight: 3.5,
            dashArray: '5, 8',
            opacity: 0.8,
            lineCap: 'round',
          }).addTo(group);
        }

        // Segment B: Solid polyline across recorded toll plazas
        const tollLatLngs = geoEvents.map((e) => [e.locLat, e.locLong]);
        L.polyline(tollLatLngs, {
          color: '#0d5f96',
          weight: 4.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        // Segment C: Dashed projected line from Latest Toll to Destination
        if (destCoords) {
          const lastEvent = geoEvents[geoEvents.length - 1];
          L.polyline([[lastEvent.locLat, lastEvent.locLong], destCoords], {
            color: '#0284c7',
            weight: 3.5,
            dashArray: '5, 8',
            opacity: 0.8,
            lineCap: 'round',
          }).addTo(group);
        }

        // Toll Plaza Markers
        geoEvents.forEach((ev, idx) => {
          const isLatest = idx === geoEvents.length - 1;

          let iconHtml = '';
          if (isLatest) {
            iconHtml = `
              <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(220, 38, 38, 0.4); animation: pulse-ring 2s infinite ease-in-out;"></div>
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #dc2626; border: 3px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m11 0h2a2 2 0 0 0 2-2v-3.5L18 8h-4v9Z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                </div>
              </div>
            `;
          } else {
            iconHtml = `
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #0d5f96; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; cursor: pointer;">
                ${idx + 1}
              </div>
            `;
          }

          const customIcon = L.divIcon({
            className: 'custom-toll-marker',
            html: iconHtml,
            iconSize: isLatest ? [36, 36] : [22, 22],
            iconAnchor: isLatest ? [18, 18] : [11, 11],
          });

          const marker = L.marker([ev.locLat, ev.locLong], { icon: customIcon }).addTo(group);

          const popupContent = `
            <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 220px;">
              <div style="background: #0d5f96; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-bottom: 6px; text-transform: uppercase;">
                ${ev.locName}
              </div>
              <div style="color: #475569; margin-bottom: 4px;">
                <strong>Event:</strong> ${ev.eventName || 'TOLL PLAZA CROSSED'}
              </div>
              <div style="color: #dc2626; font-weight: bold; margin-bottom: 4px;">
                ${ev.eventTime}
              </div>
              <div style="font-size: 10px; color: #94a3b8;">
                GPS: ${ev.locLat.toFixed(5)}, ${ev.locLong.toFixed(5)}
              </div>
            </div>
          `;
          marker.bindPopup(popupContent);
        });
      } else {
        // Zero toll events yet (e.g. freshly added vehicle!)
        if (originCoords && destCoords) {
          // Draw direct planned corridor from Origin to Destination
          L.polyline([originCoords, destCoords], {
            color: '#0d5f96',
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.8,
            lineCap: 'round',
          }).addTo(group);

          // Place initial truck marker at Origin
          const waitingIconHtml = `
            <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
              <div style="background: #132238; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; white-space: nowrap; margin-bottom: 2px; border: 1px solid #10b981;">
                ${trip.vehicleNumber} (Ready)
              </div>
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #132238; border: 2px solid #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m11 0h2a2 2 0 0 0 2-2v-3.5L18 8h-4v9Z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
              </div>
            </div>
          `;
          const waitingIcon = L.divIcon({
            className: 'waiting-vehicle-marker',
            html: waitingIconHtml,
            iconSize: [28, 44],
            iconAnchor: [0, 0],
          });
          L.marker(originCoords, { icon: waitingIcon }).addTo(group);
        } else if (
          typeof trip.latestToll?.locLat === 'number' &&
          typeof trip.latestToll?.locLong === 'number'
        ) {
          allBoundsPoints.push([trip.latestToll.locLat, trip.latestToll.locLong]);
        }
      }

      // Auto-fit bounds to include Origin, all Tolls, and Destination
      if (allBoundsPoints.length === 1) {
        map.setView(allBoundsPoints[0], 11);
      } else if (allBoundsPoints.length > 1) {
        const bounds = L.latLngBounds(allBoundsPoints);
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 13 });
      } else {
        map.setView([20.5937, 78.9629], 5);
      }
      return;
    }

    // =========================================================================
    // MODE 2: FLEET OVERVIEW (Show ALL vehicles on map simultaneously)
    // =========================================================================
    const validTrips = allTrips.filter(
      (t) =>
        typeof t.latestToll?.locLat === 'number' &&
        typeof t.latestToll?.locLong === 'number'
    );

    if (validTrips.length === 0) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }

    const allPositions = [];

    validTrips.forEach((t) => {
      const lat = t.latestToll.locLat;
      const lng = t.latestToll.locLong;
      allPositions.push([lat, lng]);

      const isLive = t.status === 'ACTIVE';

      // Custom Fleet Vehicle Marker with Plate Badge
      const fleetIconHtml = `
        <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); transition: transform 0.15s ease;">
          <div style="background: #132238; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 1.5px solid ${
            isLive ? '#10b981' : '#94a3b8'
          }; display: flex; align-items: center; gap: 4px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${
              isLive ? '#10b981' : '#94a3b8'
            }; display: inline-block;"></span>
            ${t.vehicleNumber}
          </div>
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #0d5f96; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; margin-top: 2px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3m11 0h2a2 2 0 0 0 2-2v-3.5L18 8h-4v9Z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0d5f96;"></div>
        </div>
      `;

      const fleetIcon = L.divIcon({
        className: 'fleet-vehicle-pin',
        html: fleetIconHtml,
        iconSize: [30, 48],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: fleetIcon }).addTo(group);

      // Clicking marker selects the vehicle
      marker.on('click', () => {
        if (onSelectTrip) onSelectTrip(t);
      });

      // Hover / click popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #132238;">${t.vehicleNumber}</strong>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${
              isLive ? '#d1fae5; color: #065f46;' : '#f1f5f9; color: #475569;'
            }">${t.status}</span>
          </div>
          ${
            t.origin || t.destination
              ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; margin-bottom: 6px; font-size: 11px;">
                   <div style="font-weight: 700; display: flex; align-items: center; gap: 4px;">
                     <span style="color: #059669;">🟢 ${t.origin ? t.origin.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Start'}</span>
                     <span style="color: #94a3b8;">➔</span>
                     <span style="color: #0284c7;">🏁 ${t.destination ? t.destination.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Dest'}</span>
                   </div>
                   ${t.estimatedDistanceKm ? `<div style="font-size: 10px; color: #059669; font-weight: 600; margin-top: 2px;">Route: ~${t.estimatedDistanceKm} km</div>` : ''}
                 </div>`
              : ''
          }
          <div style="color: #475569; font-size: 11px; margin-bottom: 3px;">
            <strong>Latest Toll:</strong> ${t.latestToll.locName || 'N/A'}
          </div>
          <div style="color: #dc2626; font-size: 11px; font-weight: 600; margin-bottom: 6px;">
            ${t.latestToll.eventTime || ''}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
            Total Tolls Recorded: <strong>${t.totalTolls || 0}</strong>
          </div>
          <div style="color: #0d5f96; font-weight: bold; font-size: 11px; cursor: pointer; text-decoration: underline;">
            Click to Track Full Route &rarr;
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    // Fit map to show all fleet vehicles
    if (allPositions.length > 0) {
      if (allPositions.length === 1) {
        map.setView(allPositions[0], 10);
      } else {
        const bounds = L.latLngBounds(allPositions);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
      }
    }
  }, [trip, events, allTrips]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleLayers = () => {
    setTileLayerType((prev) => (prev === 'esri' ? 'osm' : 'esri'));
  };

  // Count vehicles with coordinates
  const vehiclesWithCoordsCount = allTrips.filter(
    (t) =>
      typeof t.latestToll?.locLat === 'number' &&
      typeof t.latestToll?.locLong === 'number'
  ).length;

  return (
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Controls on Top Right */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 sm:right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Zoom Controls (Desktop only to prevent mobile clutter) */}
        <div className="hidden sm:flex bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-col">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-b border-gray-100 transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fullscreen (Desktop only, not supported on iOS Safari) */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:flex w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg items-center justify-center transition"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Layer toggle */}
        <button
          onClick={toggleLayers}
          className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 text-gray-700 shadow-lg border border-gray-200 flex items-center justify-center transition active:scale-95"
          title={`Switch Map Style (Current: ${
            tileLayerType === 'esri' ? 'Esri Gray Canvas' : 'OpenStreetMap'
          })`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Timeline trigger on desktop */}
        {trip && (
          <button
            onClick={onOpenTimeline}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-[#0d5f96] hover:bg-[#0b5180] text-white shadow-lg items-center justify-center transition"
            title="Open Toll Timeline"
          >
            <Navigation className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* TOP LEFT FLOATING BANNER & MOBILE CONTROLS */}
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 sm:left-4 max-w-[calc(100vw-4.5rem)] sm:max-w-none z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Mobile Open Sidebar Button */}
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-[#0d5f96] hover:bg-[#0b5180] text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex-shrink-0"
            title="Open Vehicles Sidebar"
          >
            <Menu className="w-4 h-4" />
            <span>Vehicles</span>
          </button>
        )}

        {trip ? (
          // Single Vehicle Focus Banner
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 max-w-full">
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold text-xs rounded-lg transition active:scale-95 flex-shrink-0"
              title="Return to view all vehicles on map"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Vehicles</span>
            </button>

            <div className="h-5 sm:h-6 w-px bg-gray-200"></div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-900 truncate">{trip.vehicleNumber}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${
                    trip.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {trip.status}
                </span>
                {trip.estimatedDistanceKm && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                    ~{trip.estimatedDistanceKm} km
                  </span>
                )}
              </div>
              {(trip.origin || trip.destination) && (
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-700 truncate mt-0.5">
                  <span className="text-emerald-700 font-semibold flex items-center gap-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0"></span>
                    <span className="truncate">{trip.origin ? trip.origin.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Start'}</span>
                  </span>
                  <span className="text-gray-400 flex-shrink-0">➔</span>
                  <span className="text-sky-700 font-semibold flex items-center gap-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0"></span>
                    <span className="truncate">{trip.destination ? trip.destination.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Dest'}</span>
                  </span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                {events.length} Tolls Recorded •{' '}
                {trip.latestToll?.locName
                  ? `${trip.latestToll.locName}`
                  : 'Awaiting toll crossing'}
              </p>
            </div>
          </div>
        ) : (
          // Fleet Overview Banner (All Vehicles Mode)
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 p-2 sm:p-2.5 px-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-[#0d5f96] flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900">Fleet Overview</span>
                <span className="text-[9px] font-bold bg-sky-100 text-[#0d5f96] px-1.5 py-0.2 rounded-full">
                  {vehiclesWithCoordsCount} on map
                </span>
              </div>
              <p className="text-[10px] text-gray-500 hidden sm:block">
                Click any vehicle pin to focus and trace its full route
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM CARD: When a vehicle is selected on small screens */}
      {trip && (
        <div className="md:hidden absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 z-10 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-3 flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs text-gray-900">{trip.vehicleNumber}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                  {events.length} tolls
                </span>
                {trip.estimatedDistanceKm && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                    ~{trip.estimatedDistanceKm} km
                  </span>
                )}
              </div>
              {(trip.origin || trip.destination) && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-800 truncate mt-0.5">
                  <span className="text-emerald-700 truncate">{trip.origin ? trip.origin.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Start'}</span>
                  <span className="text-gray-400">➔</span>
                  <span className="text-sky-700 truncate">{trip.destination ? trip.destination.split(',')[0].replace(/\(.*?\)/g, '').trim() : 'Dest'}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {trip.latestToll?.locName ? `Latest: ${trip.latestToll.locName}` : 'Awaiting toll crossing'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={onOpenTimeline}
                className="py-2 px-3 bg-[#0d5f96] hover:bg-[#0b5180] active:scale-95 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1"
                title="Open Toll Timeline"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => exportTruckReportToPdf(trip, events)}
                className="py-2 px-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
                title="Download PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Button on Mobile when in Fleet Overview */}
      {!trip && onOpenMobileSidebar && (
        <div className="md:hidden absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <button
            onClick={onOpenMobileSidebar}
            className="flex items-center gap-2 px-5 py-3 bg-[#0d5f96] hover:bg-[#0b5180] text-white text-xs font-bold rounded-full shadow-2xl active:scale-95 transition border border-white/20 whitespace-nowrap"
          >
            <Truck className="w-4 h-4" />
            <span>Vehicles & Trips ({activeCount || vehiclesWithCoordsCount})</span>
          </button>
        </div>
      )}
    </div>
  );
}
