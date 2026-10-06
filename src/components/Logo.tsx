import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
      src="/Logo.png"
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
  // Base heights increased by 20%+ for superior brand authority
  const sizeClasses = {
    xs: "h-8 md:h-9 w-auto",
    sm: "h-11 md:h-12 w-auto",
    md: isScrolled ? "h-12 md:h-14 w-auto" : "h-[58px] sm:h-[64px] md:h-[72px] w-auto",
    lg: "h-20 md:h-22 w-auto",
    xl: "h-24 md:h-28 w-auto",
  }[size];

  return (
    <div 
      id="brand-logo"
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer group transition-all duration-500 hover:scale-[1.03] ${className}`}
      aria-label="The Royal Bengal"
    >
      <img
        src="/Logo.png"
        alt="The Royal Bengal"
        referrerPolicy="no-referrer"
        className={`${sizeClasses} object-contain filter drop-shadow-[0_2px_12px_rgba(242,92,5,0.45)] transition-all duration-500 ease-in-out group-hover:drop-shadow-[0_2px_18px_rgba(242,92,5,0.65)] ${
          centered ? 'origin-center' : 'origin-left'
        }`}
      />
    </div>
  );
};

export default BrandLogo;
