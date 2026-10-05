import React from 'react';
import { ASSETS } from '../assets/images';
import TrustBadges from './TrustBadges';
import { ActivePage } from '../types';

interface HeroSectionProps {
  onSeizeHunt: () => void;
  setActivePage: (page: ActivePage) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onSeizeHunt,
  setActivePage,
}) => {
  return (
    <section id="hero-section" className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden pt-24 pb-10">
      {/* Background Image - Restored 100% visibility with subtle 5% blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="Sundarbans Mangrove Wilderness"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      {/* Spacer for top nav */}
      <div className="w-full h-8" />

      {/* Main Center Message */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center my-auto flex flex-col items-center justify-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] xl:text-4xl font-bold text-white leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-center w-full max-w-3xl mx-auto">
          <span className="block font-bold text-center">Some Dress to Impress</span>
          <span className="block mt-1 sm:mt-1.5 font-bold whitespace-normal sm:whitespace-nowrap text-center">
            While The Ambitious Aim for the Hunt.
          </span>
        </h1>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-sm sm:max-w-none mx-auto">
          <button
            id="seize-hunt-button"
            onClick={onSeizeHunt}
            className="w-full sm:w-auto px-5 sm:px-12 py-3.5 sm:py-4 bg-[#F25C05] hover:bg-[#ff6811] text-white text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.25em] font-normal uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(242,92,5,0.45)] hover:shadow-[0_6px_35px_rgba(242,92,5,0.65)] hover:-translate-y-0.5 cursor-pointer text-center flex items-center justify-center whitespace-nowrap"
          >
            Seize the First Hunt / Next Hunt
          </button>
          <button
            id="explore-collection-button"
            onClick={() => setActivePage('shop')}
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 border border-[#F25C05] text-[#F25C05] hover:bg-[#F25C05]/15 hover:text-white text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.2em] font-light uppercase transition-all duration-300 cursor-pointer text-center flex items-center justify-center whitespace-nowrap"
          >
            Explore Collection
          </button>
        </div>
      </div>

      {/* Bottom Trust Badges (Page 1 footer badges) */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 pt-8">
        <div className="border-t border-white/10 pt-6">
          <TrustBadges variant="horizontal" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
