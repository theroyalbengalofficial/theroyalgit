import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isScrolled?: boolean;
  centered?: boolean;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{ 
  className?: string; 
  alt?: string;
}> = ({ 
  className = "w-10 h-13",
  alt = "The Royal Bengal Logo",
}) => {
  return (
    <img
      src="/Logo-trimmed.png"
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/Logo.png';
      }}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`object-contain filter drop-shadow-[0_2px_10px_rgba(242,92,5,0.45)] ${className}`}
    />
  );
};

export const BrandLogo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md', 
  isScrolled = false,
  centered = false,
  onClick 
}) => {
  // Proportional height matching parent div component
  const sizeClasses = {
    xs: "h-8 md:h-9 w-auto",
    sm: "h-11 md:h-12 w-auto",
    md: isScrolled ? "h-14 md:h-16 w-auto" : "h-[68px] sm:h-[76px] md:h-[84px] w-auto",
    lg: "h-20 md:h-22 w-auto",
    xl: "h-24 md:h-28 w-auto",
    full: "h-full max-h-full w-auto",
  }[size];

  const isFill = size === 'full' || className.includes('h-full');

  return (
    <div 
      id="brand-logo"
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer group transition-all duration-500 hover:scale-[1.03] ${
        isFill ? 'h-full' : ''
      } ${className}`}
      aria-label="The Royal Bengal"
    >
      <img
        src="/Logo-trimmed.png"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/Logo.png';
        }}
        alt="The Royal Bengal"
        referrerPolicy="no-referrer"
        className={`${isFill ? 'h-full max-h-full w-auto' : sizeClasses} object-contain filter drop-shadow-[0_2px_12px_rgba(242,92,5,0.45)] transition-all duration-500 ease-in-out group-hover:drop-shadow-[0_2px_18px_rgba(242,92,5,0.65)] ${
          centered ? 'origin-center' : 'origin-left'
        }`}
      />
    </div>
  );
};

export default BrandLogo;
