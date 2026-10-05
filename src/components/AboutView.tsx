import React from 'react';
import { ASSETS } from '../assets/images';
import { BoardroomShirtIcon, WeekendShirtIcon, SignatureShirtIcon } from './HuntIcons';
import TrustBadges from './TrustBadges';
import { ActivePage } from '../types';

interface AboutViewProps {
  setActivePage: (page: ActivePage) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ setActivePage }) => {
  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden py-24 sm:py-28">
      {/* Background Image - 100% visible */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="Sundarbans Wilderness"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center fixed"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.3em] uppercase text-[#F25C05] font-bold">
            Origin & Craft
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] text-white mt-2">
            The Royal Bengal Story
          </h1>
          <div className="w-16 h-0.5 bg-[#F25C05] mx-auto mt-4" />
        </div>

        {/* Narrative Box */}
        <div className="border border-white/15 bg-black/75 p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-6 text-sm sm:text-base font-bold text-white leading-relaxed tracking-wider">
          <p className="text-lg sm:text-xl font-bold text-white text-center italic">
            &ldquo;The Royal Bengal Tiger never chased attention. It earned its territory through presence, patience, and precision.&rdquo;
          </p>

          <p className="font-bold">
            Established for those who refuse the ordinary, <strong className="text-[#F25C05] font-bold">The Royal Bengal</strong> is Bangladesh&apos;s apex menswear label. We design exclusively for ambitious individuals who treat every day as their hunt — whether closing high-stakes boardroom deals, holding court in quiet lounges, or exploring weekend retreats.
          </p>

          <p className="font-bold">
            Every garment is engineered using export-quality high-thread-count combed cottons, precision French seams, and customized mother-of-pearl buttons. We inspect every single stitch with an obsessive zero-defect QC pass before packaging.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div className="flex flex-col items-center text-center p-4 bg-white/5 border border-white/10">
              <BoardroomShirtIcon className="w-12 h-12 text-[#F25C05] mb-2" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Presence</h3>
              <p className="text-xs text-neutral-200 mt-1 font-bold">
                Structured collars and tailored cuts that project quiet command in any room.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-white/5 border border-white/10">
              <WeekendShirtIcon className="w-12 h-12 text-[#F25C05] mb-2" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Comfort</h3>
              <p className="text-xs text-neutral-200 mt-1 font-bold">
                Breathable linen blends formulated for the humid South Asian climate.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-white/5 border border-white/10">
              <SignatureShirtIcon className="w-12 h-12 text-[#F25C05] mb-2" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Precision</h3>
              <p className="text-xs text-neutral-200 mt-1 font-bold">
                Rigorous double QC passes and guaranteed 1-month no-questions exchange.
              </p>
            </div>
          </div>

          <div className="pt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('shop')}
              className="px-8 py-3.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs tracking-[0.25em] uppercase font-light transition-all shadow-[0_4px_20px_rgba(242,92,5,0.4)] cursor-pointer"
            >
              Explore The Hunts
            </button>
          </div>
        </div>

        {/* Bottom Trust Badges */}
        <div className="mt-12 pt-6">
          <TrustBadges variant="horizontal" />
        </div>
      </div>
    </section>
  );
};

export default AboutView;
