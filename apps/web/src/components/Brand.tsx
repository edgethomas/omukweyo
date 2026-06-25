import { useId } from 'react';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn('h-8 w-8 shrink-0', className)}>
      <defs>
        <linearGradient id={`${gradientId}-brand`} x1="6" x2="34" y1="4" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.48" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id={`${gradientId}-lane`} x1="10" x2="30" y1="10" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill={`url(#${gradientId}-brand)`} />
      <path
        d="M12 12.75h11.2a4.85 4.85 0 0 1 0 9.7h-7.1a4.85 4.85 0 0 0 0 9.7H28"
        fill="none"
        stroke={`url(#${gradientId}-lane)`}
        strokeWidth="3.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.75" r="2.8" fill="#F8FAFC" />
      <circle cx="28" cy="32.15" r="2.8" fill="#F8FAFC" />
      <path
        d="M28.5 9.5v6.5M31.75 12.75h-6.5"
        fill="none"
        stroke="#BFDBFE"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold text-ink', className)}>
      <BrandMark className={compact ? 'h-7 w-7' : 'h-8 w-8'} />
      {!compact && <span className="text-[17px] tracking-tight">Omukweyo</span>}
    </span>
  );
}
