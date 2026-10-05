import React, { useState } from 'react';
import { ASSETS } from '../assets/images';
import { Product } from '../types';
import { ChevronLeft, ChevronRight, Eye, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewArrivalsProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onTryProduct?: (product: Product) => void;
}

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onTryProduct?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const [activeColorIdx, setActiveColorIdx] = useState(0);

  return (
    <div className="flex flex-col group transition-all duration-300">
      {/* Image Container with Orange Outer Border */}
      <div
        className="relative aspect-[3/4] w-full border-2 border-[#F25C05] bg-black/40 overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.5)] cursor-pointer"
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

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="p-2.5 rounded-full bg-white text-black hover:bg-[#F25C05] hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Subtle Badge */}
        {product.badge && (
          <span className="absolute top-2 left-2 bg-black/80 border border-[#F25C05]/60 text-[#F25C05] text-[10px] tracking-widest px-2 py-0.5 uppercase">
            {product.badge}
          </span>
        )}
      </div>

      {/* Card Bottom Meta */}
      <div className="mt-3">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-sm sm:text-base font-light tracking-wider text-white">
            {product.currency} {product.price}
          </span>

          {/* Color Swatches */}
          <div className="flex items-center gap-1.5">
            {product.colorOptions?.map((col, idx) => (
              <button
                key={col.name}
                onClick={() => setActiveColorIdx(idx)}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-all ${
                  activeColorIdx === idx
                    ? 'scale-125 border-white ring-1 ring-[#F25C05]'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
          </div>
        </div>

        {/* Orange "View Details" Button */}
        <button
          id={`view-details-${product.id}`}
          onClick={() => onSelectProduct(product)}
          className="w-full py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs sm:text-sm font-light tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(242,92,5,0.35)] cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export const NewArrivals: React.FC<NewArrivalsProps> = ({
  products,
  onSelectProduct,
  onTryProduct,
}) => {
  const displayProducts = products.filter((p) => p.isNewArrival).length > 0
    ? products.filter((p) => p.isNewArrival)
    : products;

  const [startIndex, setStartIndex] = useState(0);

  // For responsive slider
  const itemsToShow = 4;
  const maxIndex = Math.max(0, displayProducts.length - itemsToShow);

  const nextSlide = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const visibleProducts = displayProducts.slice(startIndex, startIndex + itemsToShow);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden py-24 sm:py-28">
      {/* Background with Mangrove Roots - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.rootsBg}
          alt="Mangrove Roots Floor"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-[0.35em] text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            N E W &nbsp; A R R I V A L
          </h2>
          <div className="w-16 h-0.5 bg-[#F25C05] mx-auto mt-4 shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
        </div>

        {/* If no products uploaded yet */}
        {displayProducts.length === 0 ? (
          <div className="max-w-xl mx-auto p-8 sm:p-10 bg-black/80 backdrop-blur-md border border-white/10 text-center shadow-2xl">
            <h3 className="text-base sm:text-lg font-light tracking-[0.2em] uppercase text-white mb-2">
              New Drops Coming Soon
            </h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Our latest seasonal collection is being crafted. Stay tuned for exclusive upcoming releases.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Arrow Left */}
            {displayProducts.length > itemsToShow && (
              <button
                onClick={prevSlide}
                aria-label="Previous Products"
                className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/70 hover:bg-[#F25C05] text-white border border-white/20 hover:border-[#F25C05] transition-all duration-300 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-4 sm:px-2">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onTryProduct={onTryProduct}
                />
              ))}
            </div>

            {/* Arrow Right */}
            {displayProducts.length > itemsToShow && (
              <button
                onClick={nextSlide}
                aria-label="Next Products"
                className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-black/70 hover:bg-[#F25C05] text-white border border-white/20 hover:border-[#F25C05] transition-all duration-300 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivals;
