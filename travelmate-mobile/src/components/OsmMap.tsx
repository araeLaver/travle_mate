/**
 * OpenStreetMap 기반 지도.
 *
 * react-native-maps는 안드로이드에서 Google Maps SDK를 쓰는데, 그건 API 키가 있어야 하고
 * 키 발급에는 GCP 결제 계정이 필요하다. 키 없이 빌드하면 지도 탭이 회색 빈 화면이 된다.
 * Leaflet + OSM 타일은 키도 결제도 필요 없으므로 WebView로 띄운다.
 */

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface OsmMarker {
  id: number | string;
  latitude: number;
  longitude: number;
  color: string;
  /** 수집 반경(m). 주면 마커 둘레에 원을 그린다. */
  radius?: number;
  dimmed?: boolean;
}

export interface OsmMapHandle {
  centerOn: (latitude: number, longitude: number) => void;
}

interface Props {
  latitude: number;
  longitude: number;
  markers: OsmMarker[];
  onMarkerPress?: (id: number | string) => void;
  onRegionChange?: (region: { latitude: number; longitude: number; radiusKm: number }) => void;
  style?: object;
}

const buildHtml = (lat: number, lng: number) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #F5F4F1; }
      .leaflet-control-attribution { font-size: 9px; }
      .me { border: 3px solid #fff; border-radius: 50%; background: #4A3AFF; box-shadow: 0 0 0 2px rgba(74,58,255,.35); }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var post = function (payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };

      var map = L.map('map', { zoomControl: false, attributionControl: true })
        .setView([${lat}, ${lng}], 15);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      var meLayer = L.layerGroup().addTo(map);
      var markerLayer = L.layerGroup().addTo(map);

      window.setMe = function (lat, lng) {
        meLayer.clearLayers();
        L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: '<div class="me" style="width:16px;height:16px"></div>', iconSize: [16, 16] }),
        }).addTo(meLayer);
      };

      window.setMarkers = function (items) {
        markerLayer.clearLayers();
        items.forEach(function (item) {
          if (item.radius) {
            L.circle([item.latitude, item.longitude], {
              radius: item.radius,
              color: 'rgba(74,58,255,0.3)',
              fillColor: 'rgba(74,58,255,0.08)',
              fillOpacity: 1,
              weight: 1,
            }).addTo(markerLayer);
          }
          L.circleMarker([item.latitude, item.longitude], {
            radius: 9,
            color: '#ffffff',
            weight: 2,
            fillColor: item.color,
            fillOpacity: item.dimmed ? 0.45 : 1,
          })
            .addTo(markerLayer)
            .on('click', function () {
              post({ type: 'marker', id: item.id });
            });
        });
      };

      window.centerOn = function (lat, lng) {
        map.setView([lat, lng], Math.max(map.getZoom(), 15));
      };

      map.on('moveend', function () {
        var c = map.getCenter();
        var b = map.getBounds();
        // 화면 반경(km) — 목록을 다시 받아올 범위로 쓴다.
        var radiusKm = c.distanceTo(b.getNorthEast()) / 1000;
        post({ type: 'region', latitude: c.lat, longitude: c.lng, radiusKm: radiusKm });
      });

      window.setMe(${lat}, ${lng});
      post({ type: 'ready' });
    </script>
  </body>
</html>`;

const OsmMap = forwardRef<OsmMapHandle, Props>(
  ({ latitude, longitude, markers, onMarkerPress, onRegionChange, style }, ref) => {
    const webRef = useRef<WebView>(null);
    // 최초 좌표로만 HTML을 만든다. 이후 위치/마커는 주입 스크립트로 갱신해야
    // 사용자가 지도를 움직일 때마다 WebView가 리로드되지 않는다.
    const html = useMemo(() => buildHtml(latitude, longitude), []);

    useImperativeHandle(ref, () => ({
      centerOn: (lat: number, lng: number) => {
        webRef.current?.injectJavaScript(`window.centerOn(${lat}, ${lng}); true;`);
      },
    }));

    const pushMarkers = () => {
      webRef.current?.injectJavaScript(
        `window.setMarkers(${JSON.stringify(markers)}); window.setMe(${latitude}, ${longitude}); true;`
      );
    };

    const handleMessage = (event: WebViewMessageEvent) => {
      let payload: any;
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (payload?.type === 'ready') {
        pushMarkers();
        return;
      }
      if (payload?.type === 'marker') {
        onMarkerPress?.(payload.id);
        return;
      }
      if (payload?.type === 'region') {
        onRegionChange?.({
          latitude: payload.latitude,
          longitude: payload.longitude,
          radiusKm: payload.radiusKm,
        });
      }
    };

    // 마커가 바뀌면 다시 주입한다.
    React.useEffect(pushMarkers, [markers, latitude, longitude]);

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          style={styles.web}
          scrollEnabled={false}
        />
      </View>
    );
  }
);

OsmMap.displayName = 'OsmMap';

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#F5F4F1' },
});

export default OsmMap;
