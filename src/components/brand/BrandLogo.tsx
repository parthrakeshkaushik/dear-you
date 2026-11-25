'use client';

import React from 'react';
import Link from 'next/link';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BrandLogoVariant = 'default' | 'tile' | 'white';

export interface BrandLogoProps {
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
  withText?: boolean;
  tagline?: string;
  href?: string | null;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  taglineClassName?: string;
  alt?: string;
  priority?: boolean;
}

const SIZE_MAP: Record<BrandLogoSize, { img: string; text: string; tagline: string }> = {
  xs: {
    img: 'w-5 h-5',
    text: 'text-base font-semibold',
    tagline: 'text-[9px]',
  },
  sm: {
    img: 'w-7 h-7 sm:w-8 sm:h-8',
    text: 'text-lg sm:text-xl font-semibold',
    tagline: 'text-[10px]',
  },
  md: {
    img: 'w-9 h-9 sm:w-10 sm:h-10',
    text: 'text-xl sm:text-2xl font-semibold',
    tagline: 'text-[11px]',
  },
  lg: {
    img: 'w-12 h-12',
    text: 'text-2xl sm:text-3xl font-semibold',
    tagline: 'text-xs',
  },
  xl: {
    img: 'w-16 h-16 sm:w-20 sm:h-20',
    text: 'text-3xl sm:text-4xl font-semibold',
    tagline: 'text-sm',
  },
};

const VARIANT_SRC: Record<BrandLogoVariant, string> = {
  default: '/brand/logo.png',
  tile: '/brand/logo-tile.png',
  white: '/brand/logo-white.png',
};

export function BrandLogo({
  size = 'sm',
  variant = 'default',
  withText = false,
  tagline,
  href = '/',
  className = '',
  imageClassName = '',
  textClassName = '',
  taglineClassName = '',
  alt = 'Dear You',
}: BrandLogoProps) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const imageSrc = VARIANT_SRC[variant] || VARIANT_SRC.default;

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <img
        src={imageSrc}
        alt={alt}
        width={512}
        height={512}
        className={`${sizeConfig.img} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 ${imageClassName}`}
        loading="eager"
      />

      {/* Brand Name & Optional Subtitle */}
      {withText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif tracking-tight text-inherit block leading-tight ${sizeConfig.text} ${textClassName}`}
          >
            Dear You
          </span>
          {tagline && (
            <span
              className={`font-sans uppercase tracking-wider text-platform-muted font-medium mt-0.5 ${sizeConfig.tagline} ${taglineClassName}`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-lg"
        title="Dear You Homepage"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
