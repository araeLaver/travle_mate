import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT || '';
const ADSENSE_SCRIPT_ID = 'adsbygoogle-js';

const ensureAdSenseScript = () => {
  if (!ADSENSE_CLIENT || document.getElementById(ADSENSE_SCRIPT_ID)) {
    return;
  }
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
};

const AdBanner: React.FC<AdBannerProps> = ({ adSlot, adFormat = 'auto', className = '' }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !adRef.current) {
      return;
    }
    try {
      ensureAdSenseScript();
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium ${className}`}
        style={{ minHeight: adFormat === 'horizontal' ? 90 : 250 }}
      >
        Ad Placeholder ({adFormat})
      </div>
    );
  }

  if (!ADSENSE_CLIENT) {
    return null;
  }

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
