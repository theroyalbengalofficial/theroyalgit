import React, { useState } from 'react';
import { ASSETS } from '../assets/images';
import { Product, HuntCategory } from '../types';
import {
  SignatureShirtIcon,
  BoardroomShirtIcon,
  DailyShirtIcon,
  RoundTheClockShirtIcon,
  HolidayShirtIcon,
} from './HuntIcons';
import { Eye } from 'lucide-react';

interface ShopCatalogProps {
  products: Product[];
  selectedCategory: HuntCategory | 'all';
  onSelectCategory: (category: HuntCategory | 'all') => void;
  onSelectProduct: (product: Product) => void;
  onTryProduct?: (product: Product) => void;
}

export const ShopCatalog: React.FC<ShopCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
}) => {
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => {
        if (!p) return false;
        if (p.category === selectedCategory) return true;
        if (selectedCategory === 'holiday' && (p.category === 'weekend' || p.category === 'holiday')) return true;
        if (selectedCategory === 'weekend' && (p.category === 'holiday' || p.category === 'weekend')) return true;
        return false;
      });

  const categoryHeaders: Record<string, { title: string; icon: React.ReactNode }> = {
    signature: {
      title: 'The Signature Hunt',
      icon: <SignatureShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    boardroom: {
      title: 'The Boardroom Hunt',
      icon: <BoardroomShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    daily: {
      title: 'The Daily Hunt',
      icon: <DailyShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    '24x7': {
      title: 'The 24x7 Hunt',
      icon: <RoundTheClockShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    holiday: {
      title: 'The Holiday Hunt',
      icon: <HolidayShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    weekend: {
      title: 'The Holiday Hunt',
      icon: <HolidayShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
    all: {
      title: 'All Curated Hunts',
      icon: <SignatureShirtIcon className="w-12 h-12 text-[#F25C05]" />,
    },
  };

  const HUNT_TABS: { id: HuntCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Hunts' },
    { id: 'signature', label: 'Signature Hunt' },
    { id: 'boardroom', label: 'Boardroom Hunt' },
    { id: 'daily', label: 'Daily Hunt' },
    { id: '24x7', label: '24x7 Hunt' },
    { id: 'holiday', label: 'Holiday Hunt' },
  ];

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden py-24 sm:py-28">
      {/* Background with Mangrove roots - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="The Royal Bengal Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center fixed"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Category Header Badge from PDF Page 8 */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <div className="p-3 border border-white/20 rounded-full bg-black/60 mb-3">
            {categoryHeaders[selectedCategory]?.icon || categoryHeaders.boardroom.icon}
          </div>

          <div className="bg-[#F25C05] text-white px-8 py-2 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase shadow-[0_4px_15px_rgba(242,92,5,0.3)]">
            {categoryHeaders[selectedCategory]?.title || 'The Boardroom Hunt'}
          </div>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {HUNT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id as any)}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase transition-all font-bold ${
                  selectedCategory === tab.id
                    ? 'border-b-2 border-[#F25C05] text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Product Grid (Matching 4x2 on desktop as shown in PDF Page 8) */}
        {filteredProducts.length === 0 ? (
          <div className="max-w-md mx-auto my-12 p-8 bg-black/80 backdrop-blur-md border border-white/10 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[#F25C05] font-medium mb-3">
              Collection In Preparation
            </p>
            <p className="text-xs text-neutral-400 font-light leading-relaxed mb-6">
              New pieces for this collection will be released soon. Explore our full catalog to discover available drops.
            </p>
            <button
              onClick={() => onSelectCategory('all')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 border border-white/20 hover:border-[#F25C05] text-white text-xs uppercase tracking-[0.2em] font-light transition-all"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              return (
                <div
                  key={product.id}
                  className="flex flex-col group transition-all duration-300"
                >
                  {/* Product Image in Orange Border */}
                  <div 
                    className="relative aspect-[3/4] w-full border-2 border-[#F25C05] bg-black/40 overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.6)] cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('Boardroom%20Hunt%20Maroon') && !target.src.includes('mangrove_model')) {
                          target.src = '/assets/Boardroom Hunt Maroon - 2800.webp';
                        }
                      }}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="px-4 py-2 bg-white text-black text-xs font-light tracking-widest uppercase hover:bg-[#F25C05] hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>

                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-black/85 border border-[#F25C05]/60 text-[#F25C05] text-[9px] tracking-widest px-2 py-0.5 uppercase">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom Meta */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm font-light tracking-wider text-white">
                        {product.currency} {product.price}
                      </span>

                      {/* Color Swatch Dots */}
                      <div className="flex items-center gap-1.5">
                        {product.colorOptions?.map((opt) => (
                          <span
                            key={opt.name}
                            className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                            style={{ backgroundColor: opt.hex }}
                            title={opt.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Orange "View Details" Button */}
                    <button
                      id={`shop-view-${product.id}`}
                      onClick={() => onSelectProduct(product)}
                      className="w-full py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs font-light tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(242,92,5,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopCatalog;
