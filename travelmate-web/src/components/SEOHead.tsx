import React from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({ title, description, canonical, noIndex, jsonLd }) => {
  React.useEffect(() => {
    document.title = title ? `${title} | Fryndo` : 'Fryndo';

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setLinkRel = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    if (description) {
      setMeta('description', description);
    }

    if (noIndex) {
      setMeta('robots', 'noindex,nofollow');
    }

    if (canonical) {
      setLinkRel('canonical', canonical);
    }

    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.textContent = JSON.stringify(jsonLd);
      } else {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
      }
    }
  }, [title, description, canonical, noIndex, jsonLd]);

  return null;
};

export default SEOHead;
