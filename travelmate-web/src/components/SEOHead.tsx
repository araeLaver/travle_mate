import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: object;
}

const DEFAULT_DESCRIPTION = 'Fryndo에서 취향이 맞는 여행 동반자를 찾고 특별한 여행 경험을 함께 만들어보세요.';
const DEFAULT_OG_IMAGE = '/og-image.png';
const SITE_NAME = 'Fryndo';
const BASE_URL = 'https://fryndo.com';

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noIndex = false,
  jsonLd,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
