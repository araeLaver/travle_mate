import React, { useEffect, useRef } from 'react';
import { ItineraryItem, ItemType } from '../services/itineraryService';
import 'leaflet/dist/leaflet.css';
import './ItineraryMap.css';

// Fix Leaflet default icon path broken by webpack
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS: Record<ItemType, string> = {
  ATTRACTION: '#6366f1',
  RESTAURANT: '#f59e0b',
  CAFE: '#d97706',
  ACCOMMODATION: '#3b82f6',
  TRANSPORTATION: '#6b7280',
  ACTIVITY: '#10b981',
  SHOPPING: '#ec4899',
  FREE_TIME: '#22c55e',
  NOTE: '#94a3b8',
  OTHER: '#64748b',
};

const ITEM_EMOJIS: Record<ItemType, string> = {
  ATTRACTION: '🏛️',
  RESTAURANT: '🍽️',
  CAFE: '☕',
  ACCOMMODATION: '🏨',
  TRANSPORTATION: '🚌',
  ACTIVITY: '🎯',
  SHOPPING: '🛍️',
  FREE_TIME: '🌿',
  NOTE: '📝',
  OTHER: '📌',
};

interface Props {
  items: ItineraryItem[];
  focusItemId?: number | null;
  onMarkerClick?: (item: ItineraryItem) => void;
}

const ItineraryMap: React.FC<Props> = ({ items, focusItemId, onMarkerClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const geoItems = items.filter(i => i.latitude != null && i.longitude != null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [36.5, 127.5], // Korea center default
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, []);

  // Sync markers when items change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    if (geoItems.length === 0) return;

    const bounds: [number, number][] = [];

    geoItems.forEach(item => {
      const lat = item.latitude!;
      const lng = item.longitude!;
      const color = TYPE_COLORS[item.type];
      const emoji = ITEM_EMOJIS[item.type];

      const icon = L.divIcon({
        className: '',
        html: `<div class="itin-map-marker" style="background:${color};">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `
          <div class="itin-map-popup">
            <strong>${item.title}</strong>
            ${item.startTime ? `<br/><small>⏰ ${item.startTime}${item.endTime ? ' ~ ' + item.endTime : ''}</small>` : ''}
            ${item.placeName ? `<br/><small>📍 ${item.placeName}</small>` : ''}
            ${item.estimatedCost ? `<br/><small>💰 ${item.estimatedCost.toLocaleString()} ${item.currency || 'KRW'}</small>` : ''}
          </div>
        `,
          { maxWidth: 220 }
        );

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(item));
      }

      markersRef.current.set(item.id, marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40] });
    }
  }, [items]); // eslint-disable-line

  // Focus a specific marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusItemId == null) return;
    const marker = markersRef.current.get(focusItemId);
    if (!marker) return;
    const latlng = marker.getLatLng();
    map.flyTo(latlng, Math.max(map.getZoom(), 14), { animate: true, duration: 0.8 });
    marker.openPopup();
  }, [focusItemId]);

  return (
    <div className="itin-map-container">
      {geoItems.length === 0 && (
        <div className="itin-map-empty">
          <p>📍 위치 정보가 있는 일정이 없습니다.</p>
          <small>일정 항목에 위도/경도를 추가하면 지도에 표시됩니다.</small>
        </div>
      )}
      <div ref={containerRef} className="itin-map-leaflet" />
    </div>
  );
};

export default ItineraryMap;
