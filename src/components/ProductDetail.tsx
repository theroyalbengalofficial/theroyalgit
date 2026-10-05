import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ASSETS } from '../assets/images';
import { Product } from '../types';
import { Check, ArrowLeft, ShieldCheck, Truck, RefreshCw, ZoomIn } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, size: string, color: string) => void;
  onBack: () => void;
  onProceedToCheckout: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onBack,
  onProceedToCheckout,
}) => {
  // If product is missing for any reason, render safe fallback
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black text-white">
        <p className="text-neutral-400 mb-4">Product not found or unavailable.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-[#F25C05] text-white uppercase text-xs tracking-widest"
        >
          Back to Collection
        </button>
      </div>
    );
  }

  // Only display sizes that have available quantity (or all defined sizes if sizeStock is not set)
  const availableSizes = useMemo(() => {
    const rawSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
      ? product.sizes 
      : ['S', 'M', 'L', 'XL', '2XL'];

    if (product.sizeStock) {
      const filtered = rawSizes.filter((sz) => (product.sizeStock?.[sz] ?? 0) > 0);
      return filtered.length > 0 ? filtered : rawSizes;
    }
    return rawSizes;
  }, [product.sizes, product.sizeStock]);

  const [selectedSize, setSelectedSize] = useState<string>(
    () => availableSizes[0] || 'L'
  );
  const [selectedColor, setSelectedColor] = useState<string>(product.color || 'Signature Orange');
  const [selectedImage, setSelectedImage] = useState<string>(product.image || '');
  const [isAdded, setIsAdded] = useState(false);

  // Fabric magnification zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // Sync selected size if available sizes change
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (product.image) {
      setSelectedImage(product.image);
    }
    if (product.color && !selectedColor) {
      setSelectedColor(product.color);
    }
  }, [product.id, product.image, product.color]);

  // Gallery of 2-3 images for this specific product
  const galleryImages = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      product.gallery.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (product.image && !list.includes(product.image)) {
      list.unshift(product.image);
    }
    // If colorOptions have images, include them as well
    if (Array.isArray(product.colorOptions)) {
      product.colorOptions.forEach((co) => {
        if (co.image && !list.includes(co.image)) {
          list.push(co.image);
        }
      });
    }
    return list.filter(Boolean);
  }, [product.gallery, product.image, product.colorOptions]);

  const colorOptions = useMemo(() => {
    if (Array.isArray(product.colorOptions) && product.colorOptions.length > 0) {
      return product.colorOptions;
    }
    if (product.color) {
      return [{ name: product.color, hex: '#F25C05' }];
    }
    return [{ name: 'Signature Orange', hex: '#F25C05' }];
  }, [product.colorOptions, product.color]);

  const DEFAULT_MEASUREMENTS: Record<string, { length: number; chest: number; sleeveLength: number }> = {
    S: { length: 27.5, chest: 38, sleeveLength: 8.0 },
    M: { length: 28.0, chest: 41, sleeveLength: 8.5 },
    L: { length: 29.5, chest: 42, sleeveLength: 9.0 },
    XL: { length: 30.0, chest: 44, sleeveLength: 9.5 },
    '2XL': { length: 31.0, chest: 46, sleeveLength: 10.0 },
    '3XL': { length: 32.0, chest: 48, sleeveLength: 10.5 },
  };

  const getMeasurementForSize = (size: string) => {
    const list = Array.isArray(product.measurements) ? product.measurements : [];
    const found = list.find((m) => m && m.size && m.size.toLowerCase() === size.toLowerCase());
    if (found) return found;
    const fallback = DEFAULT_MEASUREMENTS[size.toUpperCase()] || {
      length: 28.5,
      chest: 42,
      sleeveLength: 9.0,
    };
    return {
      size,
      length: fallback.length,
      chest: fallback.chest,
      sleeveLength: fallback.sleeveLength,
    };
  };

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  const handleBuyNow = () => {
    onAddToCart(product, selectedSize, selectedColor);
    onProceedToCheckout();
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden py-24 sm:py-28">
      {/* Background Image - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center fixed"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-xs font-light tracking-[0.2em] uppercase text-neutral-300 hover:text-[#F25C05] flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </button>

        {/* Top Product Section (Page 9) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Image with Orange Border + Price + Swatches + "Grab the hunt" */}
          <div className="lg:col-span-5 flex flex-col">
            <div 
              ref={imageContainerRef}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              className="relative aspect-[3/4] w-full border-2 border-[#F25C05] bg-black/50 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-crosshair group select-none"
            >
              <img
                src={selectedImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                decoding="async"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                  transition: isZoomed ? 'transform 0.05s ease-out' : 'transform 0.3s ease-out',
                }}
                className="w-full h-full object-cover object-top will-change-transform"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.includes('Boardroom%20Hunt%20Maroon') && !target.src.includes('mangrove_model')) {
                    target.src = '/assets/Boardroom Hunt Maroon - 2800.webp';
                  }
                }}
              />

              {/* Magnifier / Fabric detail overlay HUD */}
              <div
                className={`absolute bottom-3 left-3 z-10 pointer-events-none transition-all duration-300 flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-wider uppercase font-mono ${
                  isZoomed
                    ? 'bg-[#F25C05] text-white shadow-[0_2px_12px_rgba(242,92,5,0.7)] opacity-100 scale-100'
                    : 'bg-black/75 text-neutral-300 border border-white/20 opacity-80 group-hover:opacity-100'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5 text-white" />
                <span>{isZoomed ? 'Fabric Loupe 2.5x Active' : 'Hover to Magnify Fabric'}</span>
              </div>

              {/* Fabric specification badge during zoom */}
              {isZoomed && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none bg-black/85 border border-[#F25C05]/60 text-[#F25C05] text-[9px] font-mono px-2.5 py-1 tracking-widest uppercase shadow-lg animate-in fade-in duration-200">
                  {product.fabric || '100% Cotton'}
                </div>
              )}
            </div>

            {/* Bottom Meta Bar under left image (from PDF Page 9) */}
            <div className="mt-4 flex items-center justify-between px-1">
              <span className="text-xl font-light tracking-wider text-white">
                {product.currency} {product.price}
              </span>

              {/* Color Swatches */}
              <div className="flex items-center gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => {
                      setSelectedColor(opt.name);
                      if (opt.image) setSelectedImage(opt.image);
                    }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      selectedColor === opt.name
                        ? 'scale-125 border-white ring-2 ring-[#F25C05]'
                        : 'border-white/20 hover:scale-110'
                    }`}
                    style={{ backgroundColor: opt.hex }}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            {/* Orange "Grab the hunt" Button (matching Page 9) */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                id="grab-hunt-button"
                onClick={handleAdd}
                className="py-3.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs sm:text-sm font-normal tracking-[0.25em] uppercase transition-all shadow-[0_4px_20px_rgba(242,92,5,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added
                  </>
                ) : (
                  'Grab the hunt'
                )}
              </button>
              <button
                id="buy-now-button"
                onClick={handleBuyNow}
                className="py-3.5 border border-[#F25C05] hover:bg-[#F25C05]/15 text-[#F25C05] hover:text-white text-xs sm:text-sm font-light tracking-[0.2em] uppercase transition-all cursor-pointer"
              >
                Checkout Now
              </button>
            </div>
          </div>

          {/* Right Column: Details & Measurements (matching Page 9) */}
          <div className="lg:col-span-7 flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.1em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,1)] [text-shadow:_0_2px_8px_#000,_0_4px_16px_rgba(0,0,0,0.9)]">
              {product.name}
            </h1>
            <h2 className="text-base sm:text-lg font-extralight tracking-widest text-neutral-200 mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_1px_6px_#000]">
              {product.subtitle}
            </h2>
            <div className="text-xs sm:text-sm tracking-widest text-[#F25C05] font-mono mt-1 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_0_12px_rgba(242,92,5,0.7),_0_1px_3px_#000,_0_2px_6px_#000]">
              Style Code: {product.styleCode}
            </div>

            {/* Product Specifications */}
            <div className="mt-6 space-y-2.5 text-xs sm:text-sm text-neutral-100 font-normal tracking-wider p-4 sm:p-5 bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_6px_25px_rgba(0,0,0,0.85)]">
              <p className="font-normal text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_8px_rgba(0,0,0,0.95)]">
                {product.description}
              </p>
              <p className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="text-[#F25C05] font-medium [text-shadow:_0_0_8px_rgba(242,92,5,0.5),_0_1px_3px_#000]">Fabric:</span> <span className="font-light text-white">{product.fabric}</span>
              </p>
              <p className="text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.9)]">
                <span className="text-[#F25C05] font-medium [text-shadow:_0_0_8px_rgba(242,92,5,0.5),_0_1px_3px_#000]">Color:</span> <span className="font-light text-white">{selectedColor}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-neutral-300 italic pt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.95)] font-light">
                N.B-Product Color May Slightly vary due to the photographic lighting
              </p>
            </div>

            {/* Size Selector Row (Page 9) */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-16 bg-[#F25C05] text-white text-xs tracking-widest py-1.5 px-3 text-center uppercase">
                  Size
                </span>
                {availableSizes.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-[42px] py-1.5 px-3 text-xs tracking-wider uppercase transition-all border ${
                          selectedSize === sz
                            ? 'border-[#F25C05] bg-[#F25C05] text-white font-medium shadow-[0_0_12px_rgba(242,92,5,0.4)]'
                            : 'border-white/20 bg-black/40 text-neutral-300 hover:border-white/50'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-amber-400 font-mono py-1.5 px-2 bg-amber-950/40 border border-amber-500/30">
                    Currently Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Size Measurement Table (Page 9 The Boardroom Hunt Table) */}
            {availableSizes.length > 0 && (
              <div className="mt-8 overflow-x-auto">
                <div className="min-w-[500px] border border-[#F25C05] bg-black/80">
                  {/* Table Header Bar */}
                  <div className="bg-[#F25C05] text-white text-center py-2 text-xs font-light tracking-[0.25em] uppercase">
                    The Boardroom Hunt Sizing Specs (Inches)
                  </div>

                  <table className="w-full text-center text-xs tracking-wider text-neutral-200 divide-y divide-white/10">
                    <thead className="bg-white/5 font-normal text-white">
                      <tr>
                        <th className="py-2.5 px-4 text-left border-r border-white/10">Size</th>
                        {availableSizes.map((s) => (
                          <th key={s} className="py-2.5 px-3 border-r border-white/10 last:border-r-0">
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 font-extralight">
                      <tr>
                        <td className="py-2.5 px-4 text-left border-r border-white/10 text-neutral-400">Length</td>
                        {availableSizes.map((sz) => (
                          <td key={sz} className="py-2.5 px-3 border-r border-white/10 last:border-r-0">
                            {getMeasurementForSize(sz).length}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-left border-r border-white/10 text-neutral-400">Chest</td>
                        {availableSizes.map((sz) => (
                          <td key={sz} className="py-2.5 px-3 border-r border-white/10 last:border-r-0">
                            {getMeasurementForSize(sz).chest}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 text-left border-r border-white/10 text-neutral-400">Sleeve Length</td>
                        {availableSizes.map((sz) => (
                          <td key={sz} className="py-2.5 px-3 border-r border-white/10 last:border-r-0">
                            {getMeasurementForSize(sz).sleeveLength}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reassurance Badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center text-xs text-white">
              <div className="flex flex-col items-center gap-1.5 p-3 bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                <Truck className="w-4 h-4 text-[#F25C05] drop-shadow-[0_0_8px_rgba(242,92,5,0.7)]" />
                <span className="text-[11px] sm:text-xs font-medium text-white tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.95)]">
                  2-Hour Express Dhaka
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                <RefreshCw className="w-4 h-4 text-[#F25C05] drop-shadow-[0_0_8px_rgba(242,92,5,0.7)]" />
                <span className="text-[11px] sm:text-xs font-medium text-white tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.95)]">
                  1-Month Hassle-Free
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-black/60 backdrop-blur-md border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                <ShieldCheck className="w-4 h-4 text-[#F25C05] drop-shadow-[0_0_8px_rgba(242,92,5,0.7)]" />
                <span className="text-[11px] sm:text-xs font-medium text-white tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_#000,_0_2px_6px_rgba(0,0,0,0.95)]">
                  100% Export QC Passed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Thumbnail Gallery (matching 4 thumbnails on Page 9) */}
        <div className="mt-14 pt-8 border-t border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-semibold tracking-[0.25em] uppercase text-white flex items-center gap-2">
              <span>Product Perspectives & Details</span>
              <span className="px-2 py-0.5 bg-[#F25C05]/20 text-[#F25C05] border border-[#F25C05]/40 text-[9px] font-mono">
                {galleryImages.length} {galleryImages.length === 1 ? 'Perspective' : 'Perspectives'}
              </span>
            </h3>
            {galleryImages.length > 1 && (
              <span className="text-[11px] text-neutral-400 font-light">
                Click any perspective to preview in high definition or hover over main view to inspect fabric weave
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-[3/4] w-full border-2 transition-all overflow-hidden cursor-pointer group text-left ${
                  selectedImage === img
                    ? 'border-[#F25C05] scale-[1.02] shadow-[0_0_15px_rgba(242,92,5,0.4)] ring-2 ring-[#F25C05]/40'
                    : 'border-white/20 opacity-75 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <img
                  src={img}
                  alt={`Perspective ${i + 1}`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.includes('Boardroom%20Hunt%20Maroon') && !target.src.includes('mangrove_model')) {
                      target.src = '/assets/Boardroom Hunt Maroon - 2800.webp';
                    }
                  }}
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/85 border border-white/20 text-white text-[9px] uppercase tracking-wider font-mono">
                  {i === 0 ? 'Angle 1 (Cover)' : `Angle ${i + 1}`}
                </span>
                {selectedImage === img && (
                  <span className="absolute top-2 right-2 bg-[#F25C05] text-white text-[9px] tracking-wider uppercase font-semibold px-2 py-0.5 shadow-md">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
