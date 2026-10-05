import React, { useState } from 'react';
import { ASSETS } from '../assets/images';
import { Check, ArrowRight } from 'lucide-react';

interface BrandManifestoProps {
  onReadFullStory: () => void;
}

export const BrandManifesto: React.FC<BrandManifestoProps> = ({ onReadFullStory }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setIsSubscribed(true);
    }
  };

  return (
    <section className="relative min-h-[85vh] w-full flex flex-col justify-center items-center overflow-hidden py-24 sm:py-32">
      {/* Background Mangrove Wilderness - 100% visible */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.rootsBg}
          alt="Mangrove Forest"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-105 contrast-110 brightness-95 saturate-125 transition-all duration-700"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Title & Subtitle */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.2em] text-white uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,1)] [text-shadow:_0_2px_15px_rgba(0,0,0,0.95)]">
          Not Just a Clothing Brand
        </h2>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.2em] text-[#F25C05] mt-3 uppercase drop-shadow-[0_6px_30px_rgba(242,92,5,0.6)] [text-shadow:_0_0_35px_rgba(242,92,5,0.5),_0_3px_15px_rgba(0,0,0,1)]">
          Made for the Hunt.
        </h3>

        {/* Poetic Statement */}
        <p className="mt-8 text-base sm:text-lg md:text-xl font-bold text-white leading-relaxed tracking-[0.06em] max-w-2xl mx-auto p-6 sm:p-8 bg-black/80 border-2 border-[#F25C05] shadow-[0_15px_40px_rgba(0,0,0,0.9),_0_0_25px_rgba(242,92,5,0.25)] rounded-xs drop-shadow-md">
          The Royal Bengal Tiger never chased attention. It earned its territory through
          presence, patience, and precision. With that same spirit, we welcome you to the ambush.
        </p>

        {/* Bottom Interactive Row: Email input + Join the Circle + Read the Full Story */}
        <div className="mt-12 w-full max-w-2xl mx-auto">
          {isSubscribed ? (
            <div className="p-4 bg-black/80 border-2 border-[#F25C05] text-[#F25C05] text-sm tracking-widest flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(242,92,5,0.3)]">
              <Check className="w-5 h-5" />
              Welcome to the Inner Circle. Use code <span className="font-semibold text-white">HUNT10</span> for 10% off your first hunt.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your Email Address"
                className="flex-1 px-5 py-3.5 bg-black/80 border-2 border-[#F25C05] text-white placeholder-[#F25C05] placeholder:opacity-90 text-xs sm:text-sm tracking-widest font-normal focus:outline-hidden focus:shadow-[0_0_25px_rgba(242,92,5,0.5)] shadow-[0_0_15px_rgba(242,92,5,0.2)] transition-all"
              />
              <button
                type="submit"
                id="join-circle-button"
                className="px-8 py-3.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs sm:text-sm font-light tracking-[0.2em] uppercase transition-all shadow-[0_4px_15px_rgba(242,92,5,0.4)] whitespace-nowrap cursor-pointer"
              >
                Join the Circle
              </button>
              <button
                type="button"
                id="read-story-button"
                onClick={onReadFullStory}
                className="px-7 py-3.5 bg-black/85 hover:bg-[#F25C05] text-[#F25C05] hover:text-white border-2 border-[#F25C05] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(242,92,5,0.35)] hover:shadow-[0_0_30px_rgba(242,92,5,0.7)] hover:-translate-y-0.5 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Read the Full Story</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrandManifesto;
