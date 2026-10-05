import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isScrolled?: boolean;
  onClick?: () => void;
}

export const LogoIcon: React.FC<{ 
  className?: string; 
  alt?: string;
}> = ({ 
  className = "w-8 h-11",
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
  onClick 
}) => {
  const sizeClasses = {
    xs: "h-7 w-auto",
    sm: "h-9 w-auto",
    md: "h-12 md:h-14 w-auto",
    lg: "h-16 md:h-18 w-auto",
    xl: "h-20 md:h-24 w-auto",
  }[size];

  return (
    <div 
      id="brand-logo"
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer group transition-transform duration-300 hover:scale-[1.03] ${className}`}
      aria-label="The Royal Bengal"
    >
      <img
        src="/Logo.png"
        alt="The Royal Bengal"
        referrerPolicy="no-referrer"
        className={`${sizeClasses} object-contain filter drop-shadow-[0_2px_12px_rgba(242,92,5,0.45)] transition-transform duration-500 ease-in-out group-hover:drop-shadow-[0_2px_18px_rgba(242,92,5,0.65)] origin-left ${
          isScrolled ? 'scale-100' : 'scale-[1.20]'
        }`}
      />
    </div>
  );
};

export default BrandLogo;
