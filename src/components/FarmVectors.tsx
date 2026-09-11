import React from 'react';

export const CropVector: React.FC<{
  crop: string;
  stage?: 'sprout' | 'growing' | 'mature';
  className?: string;
}> = ({ crop, stage = 'growing', className = 'w-6 h-6' }) => {
  if (stage === 'sprout') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21V11" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 14C12 14 9 13 8 10C7 7 10 7 12 9C14 7 17 7 16 10C15 13 12 14 12 14Z" fill="#34d399" fillOpacity="0.4" stroke="#10b981" />
      </svg>
    );
  }

  switch (crop?.toUpperCase()) {
    case 'WHEAT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 22V6" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 14L8 11M12 10L7 7M12 6L9 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 14L16 11M12 10L17 7M12 6L15 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="4" r="1.5" fill="#fbbf24" />
          <circle cx="8" cy="11" r="1.2" fill="#fbbf24" />
          <circle cx="16" cy="11" r="1.2" fill="#fbbf24" />
          <circle cx="7" cy="7" r="1.2" fill="#fbbf24" />
          <circle cx="17" cy="7" r="1.2" fill="#fbbf24" />
        </svg>
      );

    case 'CARROT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          {/* Green leafy top */}
          <path d="M12 7V2M10 6L7 3M14 6L17 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          {/* Carrot body */}
          <path
            d="M8.5 7C8.5 7 15.5 7 15.5 7C15.5 7 14 14 12 22C10 14 8.5 7 8.5 7Z"
            fill="#f97316"
            stroke="#ea580c"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Ridge lines */}
          <path d="M10 10H14M9.5 13H13.5M10.5 16H13" stroke="#c2410c" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );

    case 'TOMATO':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          {/* Calyx leaves */}
          <path d="M12 3V5M12 5L9 3M12 5L15 3M12 5L8 6M12 5L16 6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Tomato round fruit */}
          <circle cx="12" cy="13" r="7.5" fill="#ef4444" stroke="#dc2626" strokeWidth="1.2" />
          {/* Highlight */}
          <ellipse cx="10" cy="10" rx="2" ry="1.2" fill="#fca5a5" fillOpacity="0.6" transform="rotate(-25 10 10)" />
        </svg>
      );

    case 'STRAWBERRY':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          {/* Leaf crown */}
          <path d="M12 4L10 2M12 4L14 2M8 4C9.5 5 11 4.5 12 4C13 4.5 14.5 5 16 4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
          {/* Heart/berry body */}
          <path
            d="M7 6C5 9 6 13 8 16L12 21L16 16C18 13 19 9 17 6C15 6 13 7 12 7C11 7 9 6 7 6Z"
            fill="#ec4899"
            stroke="#db2777"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Strawberry seeds */}
          <circle cx="9.5" cy="10" r="0.7" fill="#fef08a" />
          <circle cx="14.5" cy="10" r="0.7" fill="#fef08a" />
          <circle cx="12" cy="13" r="0.7" fill="#fef08a" />
          <circle cx="10" cy="15" r="0.7" fill="#fef08a" />
          <circle cx="14" cy="15" r="0.7" fill="#fef08a" />
        </svg>
      );

    case 'MELON':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          {/* Stem vine */}
          <path d="M12 4C12 4 13 2 15 2" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          {/* Gourd round body */}
          <circle cx="12" cy="13" r="8" fill="#10b981" stroke="#047857" strokeWidth="1.2" />
          {/* Characteristic melon stripes */}
          <path d="M12 5V21" stroke="#065f46" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8 6.5C7.2 8.5 7 11 7 13C7 15 7.2 17.5 8 19.5" stroke="#065f46" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M16 6.5C16.8 8.5 17 11 17 13C17 15 16.8 17.5 16 19.5" stroke="#065f46" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'WEED':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 21V12" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 15L7 12M12 13L6 8M12 17L17 14M12 13L18 9" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 6L12 3L14 6L12 9Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="6" fill="#10b981" fillOpacity="0.5" stroke="#10b981" strokeWidth="1.5" />
        </svg>
      );
  }
};

export const FarmerVector: React.FC<{ className?: string; isOpponent?: boolean }> = ({
  className = 'w-7 h-7',
  isOpponent = false
}) => {
  const primaryColor = isOpponent ? '#f59e0b' : '#10b981';
  const strokeColor = isOpponent ? '#b45309' : '#047857';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Beacon pulse ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: primaryColor }}
      />
      <svg viewBox="0 0 28 28" fill="none" className="relative z-10 w-full h-full drop-shadow-md">
        {/* Outer shield container */}
        <circle cx="14" cy="14" r="12" fill="#090d12" stroke={primaryColor} strokeWidth="2" />
        {/* Inner agent core badge */}
        <circle cx="14" cy="14" r="8" fill={primaryColor} fillOpacity="0.2" stroke={primaryColor} strokeWidth="1.2" />
        {/* Surveyor reticle */}
        <path d="M14 4V7M14 21V24M4 14H7M21 14H24" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
        {/* Stylized agent glyph */}
        <circle cx="14" cy="11.5" r="3" fill={primaryColor} />
        <path d="M8.5 20C8.5 17 11 15.5 14 15.5C17 15.5 19.5 17 19.5 20" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const ShedVector: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      {/* Shadow base */}
      <rect x="6" y="16" width="28" height="18" rx="2" fill="#451a03" stroke="#b45309" strokeWidth="1.5" />
      {/* Roof pitched structure */}
      <path d="M4 16L20 6L36 16H4Z" fill="#78350f" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Depot Barn Door / Loading Bay */}
      <rect x="14" y="20" width="12" height="14" rx="1" fill="#1c1917" stroke="#b45309" strokeWidth="1.2" />
      {/* Cross bracing on door */}
      <path d="M14 20L26 34M26 20L14 34" stroke="#b45309" strokeWidth="1" strokeOpacity="0.7" />
      {/* Shed sign */}
      <rect x="15" y="12" width="10" height="3.5" rx="0.5" fill="#f59e0b" />
      <text x="20" y="14.8" textAnchor="middle" fill="#451a03" fontSize="3" fontWeight="bold" fontFamily="monospace">
        SHED
      </text>
    </svg>
  );
};

export const WaterDropletVector: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 2C8 2 3 7.5 3 10.5C3 13 5.2 15 8 15C10.8 15 13 13 13 10.5C13 7.5 8 2 8 2Z"
        fill="#06b6d4"
        stroke="#0891b2"
        strokeWidth="1"
      />
      <circle cx="6.5" cy="11.5" r="1" fill="#cffafe" fillOpacity="0.8" />
    </svg>
  );
};

export const MatureStarVector: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <polygon
        points="10,1 12.8,6.8 19,7.6 14.5,12 15.6,18.2 10,15.2 4.4,18.2 5.5,12 1,7.6 7.2,6.8"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="1.2"
      />
    </svg>
  );
};

export const LockedTileVector: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="5" y="9" width="10" height="8" rx="1.5" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
      <path d="M7 9V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13" r="1.2" fill="#cbd5e1" />
    </svg>
  );
};
