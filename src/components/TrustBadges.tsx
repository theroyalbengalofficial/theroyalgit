import React from 'react';

interface TrustBadgesProps {
  className?: string;
  variant?: 'horizontal' | 'compact' | 'stack';
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ 
  className = "", 
  variant = 'horizontal' 
}) => {
  return (
    <div 
      className={`flex flex-wrap items-center justify-around gap-6 text-center select-none ${
        variant === 'compact' ? 'gap-3 text-xs' : 'gap-8'
      } ${className}`}
    >
      {/* Badge 1: 2-Hour Delivery Inside Dhaka */}
      <div className="flex flex-col items-center group transition-transform duration-300 hover:scale-105">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#F25C05] flex flex-col items-center justify-center p-2 mb-2.5 bg-black/60 relative shadow-[0_0_15px_rgba(242,92,5,0.2)]">
          <div className="text-sm md:text-base font-medium text-[#F25C05] leading-none">2</div>
          <div className="text-[9px] md:text-[10px] tracking-wider text-[#F25C05] uppercase">Hours</div>
        </div>
        <p className="text-xs md:text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wide max-w-[170px]">
          2-Hour Delivery Inside Dhaka
        </p>
      </div>

      {/* Badge 2: 1-Month Exchange without Questions */}
      <div className="flex flex-col items-center group transition-transform duration-300 hover:scale-105">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#F25C05] flex items-center justify-center p-2 mb-2.5 bg-black/60 relative shadow-[0_0_15px_rgba(242,92,5,0.2)]">
          <svg className="w-7 h-7 text-[#F25C05]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </div>
        <p className="text-xs md:text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wide max-w-[180px]">
          1-Month Exchange without Questions
        </p>
      </div>

      {/* Badge 3: Export-Quality & QC-Passed */}
      <div className="flex flex-col items-center group transition-transform duration-300 hover:scale-105">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#F25C05] flex flex-col items-center justify-center p-2 mb-2.5 bg-black/60 relative shadow-[0_0_15px_rgba(242,92,5,0.2)]">
          <div className="border border-[#F25C05] rounded px-1 text-[9px] font-medium text-[#F25C05] leading-none mb-0.5">QC</div>
          <div className="text-[8px] tracking-tighter text-[#F25C05] uppercase">PASSED</div>
        </div>
        <p className="text-xs md:text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] tracking-wide max-w-[170px]">
          Export-Quality & QC-Passed
        </p>
      </div>
    </div>
  );
};

export default TrustBadges;
