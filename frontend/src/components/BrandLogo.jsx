import React from 'react';

/**
 * BrandLogo component for FrontDesk AI.
 * Renders the official brand logo from public folder with consistent aspect ratio,
 * sizing, and optimal visibility across both dark and light backgrounds.
 */
export default function BrandLogo({ 
  className = '', 
  variant = 'navbar', // 'navbar' | 'footer' | 'standalone'
  alt = 'FrontDesk AI' 
}) {
  // Exact asset discovered in public directory
  const logoSrc = '/FrontDesk.AI%20Reception%20Logo.png';

  // Responsive heights maintaining crisp aspect ratio with object-contain.
  // The PNG carries generous built-in padding, so heights run larger than the visible wordmark.
  const sizeClasses = {
    navbar: 'h-[48px] sm:h-[56px] w-auto -my-2',
    footer: 'h-[44px] sm:h-[52px] w-auto',
    standalone: 'h-[48px] sm:h-[56px] w-auto',
  }[variant] || 'h-[40px] sm:h-[44px] w-auto';

  return (
    <div className={`inline-flex items-center shrink-0 cursor-pointer ${className}`}>
      {/* The site now uses light surfaces everywhere, so the navy wordmark sits directly on the page. */}
      <img
        src={logoSrc}
        alt={alt}
        className={`${sizeClasses} object-contain select-none -mx-1.5 cursor-pointer`}
        loading="eager"
      />
    </div>
  );
}
