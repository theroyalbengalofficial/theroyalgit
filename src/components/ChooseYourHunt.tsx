import React from 'react';
import { ASSETS } from '../assets/images';
import {
  SignatureShirtIcon,
  BoardroomShirtIcon,
  DailyShirtIcon,
  RoundTheClockShirtIcon,
  HolidayShirtIcon,
} from './HuntIcons';
import { HuntCategory } from '../types';

interface ChooseYourHuntProps {
  onSelectCategory: (category: HuntCategory) => void;
}

export const ChooseYourHunt: React.FC<ChooseYourHuntProps> = ({ onSelectCategory }) => {
  const hunts: {
    category: HuntCategory;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      category: 'signature',
      title: 'Signature Hunt',
      description: 'The pieces that started it all. Tailored apex mastery.',
      icon: <SignatureShirtIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />,
    },
    {
      category: 'boardroom',
      title: 'Boardroom Hunt',
      description: 'Tailored for the rooms where decisions get made.',
      icon: <BoardroomShirtIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />,
    },
    {
      category: 'daily',
      title: 'Daily Hunt',
      description: 'Effortless, immaculate presence built for everyday command.',
      icon: <DailyShirtIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />,
    },
    {
      category: '24x7',
      title: '24x7 Hunt',
      description: 'Non-stop performance and breathability from morning rush to late night.',
      icon: <RoundTheClockShirtIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />,
    },
    {
      category: 'holiday',
      title: 'Holiday Hunt',
      description: 'Sharp enough to stay in control, comfortably and effortlessly.',
      icon: <HolidayShirtIcon className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />,
    },
  ];

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden py-24 sm:py-28">
      {/* Background with Model photoshoot in Sundarbans - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.modelBg}
          alt="Model in The Royal Bengal Striped Linen Shirt"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-100"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      {/* Top Header Label (Right aligned as in Page 2) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 flex flex-col md:items-end text-left md:text-right pt-6">
        <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-bold">
          Curated with Purpose
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] text-white mt-1 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          Choose Your Hunt
        </h2>
        <div className="w-20 h-0.5 bg-[#F25C05] mt-3 md:ml-auto shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Bottom Hunt Columns (Signature, Boardroom, Daily, 24x7, Holiday) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-auto pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4 xl:gap-5">
          {hunts.map((hunt) => (
            <div
              key={hunt.category}
              className="flex flex-col items-center text-center p-5 sm:p-6 bg-black/75 border border-white/10 hover:border-[#F25C05]/60 transition-all duration-300 group shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Line Art Icon Container */}
              <div className="mb-4 p-3.5 rounded-full border border-white/20 group-hover:border-[#F25C05] group-hover:scale-110 transition-all duration-300 bg-black/40">
                {hunt.icon}
              </div>

              {/* Category Pill Title */}
              <div className="w-full bg-[#F25C05] text-white py-2 px-3 text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase mb-3 shadow-[0_4px_15px_rgba(242,92,5,0.3)]">
                {hunt.title}
              </div>

              {/* Description */}
              <p className="text-[11px] sm:text-xs text-white font-bold leading-relaxed tracking-wide min-h-[44px] mb-5 max-w-xs">
                {hunt.description}
              </p>

              {/* Explore Button */}
              <button
                id={`explore-${hunt.category}`}
                onClick={() => onSelectCategory(hunt.category)}
                className="mt-auto text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-[#F25C05] hover:text-white transition-colors duration-300 flex items-center gap-1.5 group-hover:translate-x-1 cursor-pointer"
              >
                EXPLORE
                <span className="text-sm leading-none transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChooseYourHunt;
