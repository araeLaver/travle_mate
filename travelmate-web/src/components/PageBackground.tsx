import React from 'react';

type Variant = 'auth' | 'app';

const images: Record<Variant, string> = {
  auth: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=75&auto=format&fit=crop',
  app: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=75&auto=format&fit=crop',
};

interface PageBackgroundProps {
  variant?: Variant;
}

const PageBackground: React.FC<PageBackgroundProps> = ({ variant = 'app' }) => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
      style={{ backgroundImage: `url(${images[variant]})` }}
    />
    <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0a0b]/85" />
  </div>
);

export default PageBackground;
