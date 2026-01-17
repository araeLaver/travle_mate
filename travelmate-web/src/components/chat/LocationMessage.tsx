import React from 'react';
import './LocationMessage.css';

// SVG Icons
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const NavigationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  address?: string;
  isMyMessage?: boolean;
}

const LocationMessage: React.FC<LocationMessageProps> = ({
  latitude,
  longitude,
  locationName,
  address,
  isMyMessage = false,
}) => {
  // 정적 지도 이미지 URL 생성 (OpenStreetMap 타일 사용)
  const getStaticMapUrl = () => {
    // OpenStreetMap 스타일 정적 맵 사용
    const zoom = 15;
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=300x150&maptype=osmarenderer&markers=${latitude},${longitude},ol-marker`;
  };

  // Google Maps 링크 (모바일에서 앱으로 열림)
  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  };

  // 네이버 지도 링크
  const getNaverMapsUrl = () => {
    return `https://map.naver.com/v5/search/${latitude},${longitude}`;
  };

  // 카카오맵 링크
  const getKakaoMapsUrl = () => {
    return `https://map.kakao.com/link/map/${locationName || '공유된 위치'},${latitude},${longitude}`;
  };

  const handleOpenMap = () => {
    // 모바일인 경우 Google Maps 앱 시도
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(getGoogleMapsUrl(), '_blank');
    } else {
      window.open(getGoogleMapsUrl(), '_blank');
    }
  };

  const handleNaverMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getNaverMapsUrl(), '_blank');
  };

  const handleKakaoMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getKakaoMapsUrl(), '_blank');
  };

  return (
    <div
      className={`location-message ${isMyMessage ? 'my-message' : ''}`}
      onClick={handleOpenMap}
      data-testid="location-message-container"
    >
      {/* 지도 미리보기 */}
      <div className="map-preview">
        <img
          src={getStaticMapUrl()}
          alt="위치 미리보기"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 배경으로 대체
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="map-overlay">
          <div className="location-pin">
            <MapPinIcon />
          </div>
        </div>
      </div>

      {/* 위치 정보 */}
      <div className="location-info">
        <div className="location-header">
          <MapPinIcon />
          <span className="location-name">
            {locationName || '공유된 위치'}
          </span>
        </div>
        {address && <p className="location-address" data-testid="location-address">{address}</p>}
        <p className="location-coords">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      </div>

      {/* 지도 앱 버튼들 */}
      <div className="map-actions">
        <button className="map-btn google" onClick={handleOpenMap}>
          <ExternalLinkIcon />
          <span>Google</span>
        </button>
        <button className="map-btn naver" onClick={handleNaverMap}>
          <NavigationIcon />
          <span>네이버</span>
        </button>
        <button className="map-btn kakao" onClick={handleKakaoMap}>
          <NavigationIcon />
          <span>카카오</span>
        </button>
      </div>
    </div>
  );
};

export default LocationMessage;
