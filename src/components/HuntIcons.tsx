import React from 'react';

interface IconProps {
  className?: string;
}

// 1. Boardroom Hunt Icon: Formal shirt with necktie
export const BoardroomShirtIcon: React.FC<IconProps> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer shirt shape */}
      <path d="M25 32 L38 22 L62 22 L75 32 L82 52 L70 55 L68 40 L68 88 L32 88 L32 40 L30 55 L18 52 Z" />
      {/* Collar */}
      <path d="M38 22 L50 36 L62 22" />
      <path d="M38 22 L45 32" />
      <path d="M62 22 L55 32" />
      {/* Necktie */}
      <path d="M46 36 L54 36 L56 42 L50 45 L44 42 Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M47 45 L44 72 L50 78 L56 72 L53 45 Z" fill="currentColor" fillOpacity="0.15" />
      <line x1="50" y1="45" x2="50" y2="76" strokeDasharray="2 2" />
    </svg>
  );
};

// 2. Weekend Hunt Icon: Open Cuban collar resort shirt with floral/leaf pattern
export const WeekendShirtIcon: React.FC<IconProps> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Short sleeve casual shirt */}
      <path d="M22 34 L36 22 L64 22 L78 34 L85 52 L72 56 L69 42 L69 88 L31 88 L31 42 L28 56 L15 52 Z" />
      {/* Wide open Cuban notched collar */}
      <path d="M36 22 L44 38 L38 42 L48 46 L50 46 L52 46 L62 42 L56 38 L64 22" />
      {/* Center placket */}
      <line x1="50" y1="46" x2="50" y2="88" />
      <circle cx="50" cy="56" r="1.5" fill="currentColor" />
      <circle cx="50" cy="68" r="1.5" fill="currentColor" />
      <circle cx="50" cy="80" r="1.5" fill="currentColor" />
      {/* Mangrove leaf line pattern inside shirt */}
      <path d="M38 52 C42 56, 42 62, 38 68" strokeDasharray="1.5 2" />
      <path d="M62 52 C58 56, 58 62, 62 68" strokeDasharray="1.5 2" />
    </svg>
  );
};

// 3. Signature Hunt Icon: Classic button-down with pocket and buttons
export const SignatureShirtIcon: React.FC<IconProps> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Shirt silhouette */}
      <path d="M24 32 L38 22 L62 22 L76 32 L83 50 L71 54 L68 40 L68 88 L32 88 L32 40 L29 54 L17 50 Z" />
      {/* Button-down collar points */}
      <path d="M38 22 L47 34 L40 38" />
      <path d="M62 22 L53 34 L60 38" />
      {/* Collar button points */}
      <circle cx="41" cy="36" r="1" fill="currentColor" />
      <circle cx="59" cy="36" r="1" fill="currentColor" />
      {/* Chest pocket */}
      <path d="M57 48 L64 48 L64 58 L60.5 61 L57 58 Z" />
      {/* Center placket and buttons */}
      <line x1="50" y1="32" x2="50" y2="88" />
      <circle cx="50" cy="44" r="1.5" fill="currentColor" />
      <circle cx="50" cy="54" r="1.5" fill="currentColor" />
      <circle cx="50" cy="64" r="1.5" fill="currentColor" />
      <circle cx="50" cy="74" r="1.5" fill="currentColor" />
    </svg>
  );
};

// 4. Daily Hunt Icon: Clean crisp tailored everyday shirt
export const DailyShirtIcon: React.FC<IconProps> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Shirt silhouette */}
      <path d="M24 32 L38 22 L62 22 L76 32 L83 50 L71 54 L68 40 L68 88 L32 88 L32 40 L29 54 L17 50 Z" />
      {/* Clean modern spread collar */}
      <path d="M38 22 L46 30 L54 30 L62 22" />
      <path d="M46 30 L50 35 L54 30" />
      {/* Center placket and minimal buttons */}
      <line x1="50" y1="35" x2="50" y2="88" />
      <circle cx="50" cy="46" r="1.5" fill="currentColor" />
      <circle cx="50" cy="58" r="1.5" fill="currentColor" />
      <circle cx="50" cy="70" r="1.5" fill="currentColor" />
      <circle cx="50" cy="82" r="1.5" fill="currentColor" />
    </svg>
  );
};

// 5. 24x7 Hunt Icon: Performance comfort stretch all-day shirt
export const RoundTheClockShirtIcon: React.FC<IconProps> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Shirt silhouette */}
      <path d="M24 32 L38 22 L62 22 L76 32 L83 50 L71 54 L68 40 L68 88 L32 88 L32 40 L29 54 L17 50 Z" />
      {/* Ergonomic flex collar */}
      <path d="M38 22 L50 32 L62 22" />
      <path d="M44 28 L50 36 L56 28" />
      {/* Placket */}
      <line x1="50" y1="36" x2="50" y2="88" />
      <circle cx="50" cy="48" r="1.5" fill="currentColor" />
      <circle cx="50" cy="62" r="1.5" fill="currentColor" />
      <circle cx="50" cy="76" r="1.5" fill="currentColor" />
      {/* 24x7 subtle orbital dynamic motion arch */}
      <path d="M68 64 A 8 8 0 1 1 76 72" strokeDasharray="1.5 2" strokeWidth="1.5" />
    </svg>
  );
};

// 6. Holiday Hunt Icon: Relaxed open Cuban collar resort shirt (alias for Weekend)
export const HolidayShirtIcon = WeekendShirtIcon;
