import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-bold',
};

// Deterministic gradient generator for consistent avatar backgrounds
const GRADIENTS = [
  'from-indigo-600 to-indigo-800 text-white',
  'from-sky-600 to-blue-800 text-white',
  'from-violet-600 to-purple-800 text-white',
  'from-emerald-600 to-teal-800 text-white',
  'from-rose-600 to-pink-800 text-white',
  'from-amber-600 to-orange-800 text-white',
];

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className = '' }) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const gradientIndex = Math.abs(
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % GRADIENTS.length;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover shrink-0 border border-slate-700/60 shadow-sm ${SIZE_MAP[size]} ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br ${GRADIENTS[gradientIndex]} border border-white/10 shadow-sm select-none ${SIZE_MAP[size]} ${className}`}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};
