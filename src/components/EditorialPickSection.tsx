import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Product } from '../types';

export interface EditorialItem {
  id: string;
  personaTitle: string;
  fabricSubtitle: string;
  price: number;
  imageLandscape: string;
  imagePortrait: string;
  color: string;
  category: string;
  description: string;
  productRef?: Product;
}

export const EDITORIAL_ITEMS: EditorialItem[] = [
  {
    id: 'editorial-showstopper',
    personaTitle: 'For the Showstopper with Showmanship',
    fabricSubtitle: 'Ivory stripe, Cuban collar',
    price: 2600,
    imageLandscape: '/assets/editorial/editorial_showstopper.webp',
    imagePortrait: '/assets/editorial/editorial_showstopper_card.webp',
    color: 'Ivory Stripe',
    category: 'signature',
    description: 'Bespoke Cuban collar silhouette in textured ivory stripe. Designed for effortless magnetism and statement presence.',
  },
  {
    id: 'editorial-signature',
    personaTitle: 'For the Signature Appearances',
    fabricSubtitle: 'Sage stripe',
    price: 2600,
    imageLandscape: '/assets/editorial/editorial_signature_appearances.webp',
    imagePortrait: '/assets/editorial/editorial_signature_appearances.webp',
    color: 'Sage Stripe',
    category: 'signature',
    description: 'Earthy sage tones woven with tailored pin-striping. Crafted to command attention in executive and distinguished gatherings.',
  },
  {
    id: 'editorial-ambitious',
    personaTitle: 'For the simply ambitious',
    fabricSubtitle: 'Midnight, mandarin collar',
    price: 2500,
    imageLandscape: '/assets/editorial/editorial_simply_ambitious.webp',
    imagePortrait: '/assets/editorial/editorial_simply_ambitious.webp',
    color: 'Midnight Navy',
    category: '24x7',
    description: 'Minimalist mandarin band collar rendered in deep midnight blue. Clean lines tailored for relentless drive and calm authority.',
  },
  {
    id: 'editorial-time-is-now',
    personaTitle: 'For the ones who believe their time is now',
    fabricSubtitle: 'Slate navy',
    price: 2500,
    imageLandscape: '/assets/editorial/editorial_believe_time_is_now.webp',
    imagePortrait: '/assets/editorial/editorial_believe_time_is_now.webp',
    color: 'Slate Navy',
    category: 'boardroom',
    description: 'Heavyweight organic cotton with subtle slate textures. Engineered for bold decision-makers who refuse to wait.',
  },
  {
    id: 'editorial-fearless',
    personaTitle: 'For the fearless dreamers',
    fabricSubtitle: 'Forest green',
    price: 2500,
    imageLandscape: '/assets/editorial/editorial_fearless_dreamers.webp',
    imagePortrait: '/assets/editorial/editorial_fearless_dreamers.webp',
    color: 'Forest Green',
    category: 'holiday',
    description: 'Deep forest green weave paired with iconic Royal Bengal orange motif embroidery. Built for visionary trailblazers.',
  },
];

interface EditorialPickSectionProps {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, size: string, color: string) => void;
  onProceedToCheckout?: (product: Product, size: string, color: string) => void;
}

export const EditorialPickSection: React.FC<EditorialPickSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onProceedToCheckout,
}) => {
  // Derive active editorial items:
  // If products are provided and some have isEditorialPick === true, use those!
  // Otherwise fallback to curated EDITORIAL_ITEMS defaults.
  const editorialList: EditorialItem[] = useMemo(() => {
    if (products && products.length > 0) {
      const selected = products.filter((p) => p.isEditorialPick);
      if (selected.length > 0) {
        return selected.map((p) => ({
          id: p.id,
          personaTitle: p.editorialPersona || p.name,
          fabricSubtitle: p.editorialSubtitle || p.subtitle || `${p.fabric || 'Cotton'}, ${p.color || 'Signature'}`,
          price: p.price,
          imageLandscape: p.editorialLandscapeImage || p.gallery?.[1] || p.image,
          imagePortrait: p.image || p.gallery?.[0] || '/assets/editorial/editorial_showstopper.webp',
          color: p.color || 'Signature',
          category: p.category || 'signature',
          description: p.description || '',
          productRef: p,
        }));
      }
    }
    return EDITORIAL_ITEMS;
  }, [products]);

  // Expanded item state (null if collapsed, or the selected EditorialItem)
  const [expandedItem, setExpandedItem] = useState<EditorialItem | null>(null);

  // Selected sizes for expanded view & per-card
  const [expandedSize, setExpandedSize] = useState<string>('M');
  const [cardSizes, setCardSizes] = useState<Record<string, string>>({
    'editorial-showstopper': 'M',
    'editorial-signature': 'M',
    'editorial-ambitious': 'M',
    'editorial-time-is-now': 'M',
    'editorial-fearless': 'M',
  });

  // Carousel ref and scroll progress
  const carouselRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [orderingItemId, setOrderingItemId] = useState<string | null>(null);

  const availableSizes = ['M', 'L', 'XL'];

  // Convert an editorial item to a Store Product for Cart & Checkout integration
  const toProduct = (item: EditorialItem): Product => {
    if (item.productRef) {
      return item.productRef;
    }
    return {
      id: item.id,
      name: item.personaTitle,
      subtitle: item.fabricSubtitle,
      styleCode: item.id.toUpperCase(),
      category: item.category as any,
      price: item.price,
      currency: 'Tk.',
      stock: 25,
      sizeStock: { M: 10, L: 10, XL: 5 },
      description: item.description,
      fabric: '100% Export Grade Cotton',
      color: item.color,
      colorOptions: [{ name: item.color, hex: '#F25C05' }],
      image: item.imagePortrait,
      sizes: ['M', 'L', 'XL'],
      gallery: [item.imageLandscape, item.imagePortrait],
      measurements: [
        { size: 'M', length: 28, chest: 41, sleeveLength: 8.5 },
        { size: 'L', length: 29.5, chest: 42, sleeveLength: 9 },
        { size: 'XL', length: 30, chest: 44, sleeveLength: 9.5 },
      ],
    };
  };

  const handleCardClick = (item: EditorialItem) => {
    setExpandedItem(item);
    setExpandedSize(cardSizes[item.id] || 'M');

    // Smooth scroll to expanded section
    setTimeout(() => {
      if (expandedRef.current) {
        expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleOrderNow = (item: EditorialItem, size: string) => {
    // Prevent duplicate rapid clicks and button lag
    if (orderingItemId) return;
    setOrderingItemId(item.id);

    const product = toProduct(item);

    // Call onProceedToCheckout ONLY, preventing double additions to cart
    if (onProceedToCheckout) {
      onProceedToCheckout(product, size, item.color);
    } else if (onAddToCart) {
      onAddToCart(product, size, item.color);
    }

    setTimeout(() => {
      setOrderingItemId(null);
    }, 600);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.75;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      }
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <section id="editorial-pick-section" className="relative bg-[#050505] text-white py-16 sm:py-24 border-t border-b border-white/10 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#F25C05]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#F25C05]/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Editorial Header (2-Column Grid as shown in image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 lg:mb-16">
          {/* Left Column: Heading & Tagline */}
          <div className="lg:col-span-5">
            <div className="inline-block relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
                Editorial Pick
              </h2>
              {/* White accent underline directly beneath 'Editorial' */}
              <div className="w-28 sm:w-36 h-[2.5px] bg-white mt-2 mb-4" />
            </div>

            <p className="font-serif italic text-2xl sm:text-3xl text-[#F25C05] leading-snug mt-2">
              Wear it like you already know what’s coming.
            </p>
          </div>

          {/* Right Column: Editorial Manifesto Paragraphs */}
          <div className="lg:col-span-7 flex flex-col gap-4 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            <p>
              Bangladesh's next chapter is in the making, by men becoming what they dream of. If you are one of them, we have World-class Export Shirts carefully crafted, served to you first. You deserve 100% export quality shirts. Handpicked fabrics, so you look extravagant in the simplest way, for every glorious opportunities.
            </p>
            <p>
              Homegrown craftsmanship just to carry the weight of your impact that no one ever saw it coming. The Royal Bengal men goes for excellence, applause follows, without even demanding. Are you The Royal Bengal? Made for the hunt.
            </p>
          </div>
        </div>

        {/* EXPANDED PRODUCT BANNER (Appears when any product is clicked) */}
        {expandedItem && (
          <div
            ref={expandedRef}
            className="mb-14 border border-[#F25C05]/60 bg-[#0a0a0a] shadow-[0_10px_40px_rgba(242,92,5,0.18)] transition-all duration-500 animate-in fade-in slide-in-from-top-4 relative overflow-hidden"
          >
            {/* Close / Collapse button */}
            <button
              onClick={() => setExpandedItem(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/80 hover:bg-[#F25C05] text-neutral-400 hover:text-white border border-white/10 transition-colors cursor-pointer group"
              title="Close expanded view"
              aria-label="Close expanded view"
            >
              <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Side: Wide Photo */}
              <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] bg-neutral-950 overflow-hidden">
                <img
                  src={expandedItem.imageLandscape}
                  alt={expandedItem.personaTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
              </div>

              {/* Right Side: Product Details */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-black/70">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#F25C05] font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#F25C05]" />
                  Editorial Spotlight
                </span>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {expandedItem.personaTitle}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1.5 mb-5">
                  {expandedItem.fabricSubtitle}
                </p>

                {/* Size Selection & Price */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      {availableSizes.map((size) => {
                        const isSelected = expandedSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => setExpandedSize(size)}
                            className={`w-10 h-10 sm:w-11 sm:h-11 border text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-white bg-white/10 text-white ring-1 ring-white/50 shadow-sm'
                                : 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white bg-black/40'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {/* Price right to size */}
                    <div className="text-right">
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-400 block font-light">
                        Price
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-[#F25C05] font-mono tracking-tight whitespace-nowrap">
                        Tk. {expandedItem.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2 font-light tracking-wide">
                    European standard sizing
                  </p>
                </div>

                {/* Order Button */}
                <button
                  disabled={orderingItemId === expandedItem.id}
                  onClick={() => handleOrderNow(expandedItem, expandedSize)}
                  className="w-full sm:w-auto bg-[#F25C05] hover:bg-[#ff6910] active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait text-white font-extrabold text-xs sm:text-sm tracking-[0.14em] uppercase py-3.5 px-6 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(242,92,5,0.4)] text-center mt-2 mb-3 flex items-center justify-center gap-2"
                >
                  {orderingItemId === expandedItem.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>PROCEEDING TO CHECKOUT...</span>
                    </>
                  ) : (
                    <span>ORDER NOW TO SEIZE YOUR NEXT HUNT</span>
                  )}
                </button>

                <p className="text-[11px] text-neutral-400 font-light tracking-wide">
                  Dhaka Express delivery and a 1-month exchange guarantee.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CAROUSEL CONTROLS (Arrows at top right above cards) */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
            {expandedItem ? 'All Editorial Selections' : 'Click Any Product To Expand'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              className="w-9 h-9 border border-neutral-800 hover:border-[#F25C05] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer bg-black/40 hover:bg-[#F25C05]/10"
              title="Previous"
              aria-label="Previous products"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="w-9 h-9 border border-neutral-800 hover:border-[#F25C05] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer bg-black/40 hover:bg-[#F25C05]/10"
              title="Next"
              aria-label="Next products"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CAROUSEL CARDS TRACK */}
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {editorialList.map((item) => {
            const isExpanded = expandedItem?.id === item.id;
            const currentSize = cardSizes[item.id] || 'M';

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`flex-none w-[280px] sm:w-[292px] snap-start bg-[#0a0a0a] border transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 ${
                  isExpanded
                    ? 'border-[#F25C05] ring-1 ring-[#F25C05]/60 shadow-[0_8px_30px_rgba(242,92,5,0.25)]'
                    : 'border-white/10 hover:border-[#F25C05]/60 shadow-lg'
                }`}
              >
                {/* Product Photo */}
                <div className="relative w-full h-[330px] sm:h-[340px] overflow-hidden bg-neutral-950 border-b border-white/5">
                  <img
                    src={item.imagePortrait}
                    alt={item.personaTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle top indicator if expanded */}
                  {isExpanded && (
                    <div className="absolute top-2 left-2 bg-[#F25C05] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 shadow-md">
                      Expanded View
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-black/60">
                  <div>
                    <h4 className="text-white font-extrabold text-sm sm:text-base tracking-tight leading-snug line-clamp-2 min-h-[44px]">
                      {item.personaTitle}
                    </h4>

                    <p className="text-xs text-neutral-400 font-medium mt-1 mb-4">
                      {item.fabricSubtitle}
                    </p>

                    {/* Size Selector and Price */}
                    <div
                      className="mb-4"
                      onClick={(e) => e.stopPropagation()} // Prevent triggering card expand on size change
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Sizes */}
                        <div className="flex items-center gap-1.5">
                          {availableSizes.map((size) => {
                            const isSelected = currentSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() =>
                                  setCardSizes((prev) => ({ ...prev, [item.id]: size }))
                                }
                                className={`w-8 h-8 sm:w-9 sm:h-9 border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-white bg-white/10 text-white ring-1 ring-white/50'
                                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white bg-black/40'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>

                        {/* Price right to size */}
                        <div className="text-right">
                          <span className="text-[#F25C05] font-extrabold text-sm sm:text-base font-mono tracking-tight whitespace-nowrap">
                            Tk. {item.price?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-2 font-light tracking-wide">
                        European standard sizing
                      </p>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    type="button"
                    disabled={orderingItemId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderNow(item, currentSize);
                    }}
                    className="w-full bg-[#F25C05] hover:bg-[#ff6910] active:scale-[0.98] disabled:opacity-75 disabled:cursor-wait text-white font-extrabold text-[11px] sm:text-xs tracking-[0.1em] uppercase py-3 px-3 transition-all duration-200 cursor-pointer shadow-md text-center mt-2 flex items-center justify-center gap-2"
                  >
                    {orderingItemId === item.id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>PROCEEDING...</span>
                      </>
                    ) : (
                      <span>ORDER NOW TO SEIZE YOUR NEXT HUNT</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM SCROLL PROGRESS BAR (As in mockup) */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => scrollCarousel('left')}
            className="text-neutral-500 hover:text-[#F25C05] transition-colors cursor-pointer text-xs"
            aria-label="Scroll left"
          >
            ◀
          </button>
          <div className="relative flex-1 h-[3px] bg-neutral-900 rounded-none overflow-hidden">
            <div
              className="h-full bg-[#F25C05] transition-all duration-150"
              style={{
                width: `${Math.max(20, scrollProgress)}%`,
                marginLeft: `${(scrollProgress * (100 - Math.max(20, scrollProgress))) / 100}%`,
              }}
            />
          </div>
          <button
            onClick={() => scrollCarousel('right')}
            className="text-neutral-500 hover:text-[#F25C05] transition-colors cursor-pointer text-xs"
            aria-label="Scroll right"
          >
            ▶
          </button>
        </div>

        {/* TRUST BADGES ROW (100% EXPORT QUALITY, DHAKA EXPRESS DELIVERY, 1-MONTH EXCHANGE GUARANTEE) */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm tracking-[0.18em] font-semibold text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="text-[#F25C05] text-xs">◆</span>
              <span>100% EXPORT QUALITY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F25C05] text-xs">◆</span>
              <span>DHAKA EXPRESS DELIVERY</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F25C05] text-xs">◆</span>
              <span>1-MONTH EXCHANGE GUARANTEE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialPickSection;
