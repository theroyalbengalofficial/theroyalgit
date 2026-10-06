import React, { useState, useEffect } from 'react';
import BrandLogo from './Logo';
import { ActivePage, CartItem } from '../types';
import { ShoppingBag, Menu, X } from 'lucide-react';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  onOpenGatewaysConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  cartItems,
  setIsCartOpen,
  onOpenGatewaysConfig,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mark as scrolled when user scrolls more than 20px
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setMobileMenuOpen(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navItems: { label: string; page: ActivePage }[] = [
    { label: 'ABOUT', page: 'about' },
    { label: 'EXCHANGE', page: 'exchange' },
    { label: 'SHOP', page: 'shop' },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/10 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.8)] py-1.5 md:py-2' 
        : 'bg-black/90 backdrop-blur-sm shadow-md py-2.5 sm:py-3 md:py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================== DESKTOP NAVIGATION BAR (md and up) ==================== */}
        <div className={`hidden md:flex items-center justify-between transition-all duration-500 ${
          isScrolled ? 'h-18 md:h-20' : 'h-22 md:h-26'
        }`}>
          {/* Logo on Left (20% bigger with luxury breathing room) */}
          <div className="flex items-center">
            <BrandLogo 
              size="md"
              isScrolled={isScrolled}
              onClick={() => handleNavClick('home')}
            />
          </div>

          {/* Desktop Links + Cart on Right */}
          <nav className="flex items-center gap-3 lg:gap-4">
            {navItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  id={`nav-link-${item.page}`}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-5 py-2.5 text-xs lg:text-sm tracking-[0.2em] font-bold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[#F25C05] text-white shadow-[0_0_20px_rgba(242,92,5,0.4)]'
                      : 'bg-transparent text-white border border-[#F25C05]/80 hover:bg-[#F25C05]/20 hover:border-[#F25C05]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Desktop Cart Trigger */}
            <button
              id="cart-button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 ml-2 text-white/90 hover:text-white border border-[#F25C05]/50 hover:border-[#F25C05] bg-black/40 transition-all duration-300 group cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#F25C05] group-hover:scale-110 transition-transform" />
              {totalCartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F25C05] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {totalCartCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* ==================== MOBILE NAVIGATION BAR (below md) ==================== */}
        <div className="md:hidden flex flex-col transition-all duration-500">
          
          {/* Row 1: Logo, Hamburger (scrolled), and Cart toggle */}
          <div className={`relative flex items-center justify-between transition-all duration-500 ${
            isScrolled ? 'h-16' : 'min-h-[64px] pb-1'
          }`}>
            
            {/* Left Slot: Hamburger Button (Dissolves in only when scrolled) */}
            <div className={`flex items-center transition-all duration-400 ease-in-out ${
              isScrolled 
                ? 'opacity-100 scale-100 w-10' 
                : 'opacity-0 scale-75 w-0 overflow-hidden pointer-events-none'
            }`}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center text-white border border-white/20 bg-black/60 hover:border-[#F25C05] transition-all cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[#F25C05]" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* Center / Logo Slot: Moves to exact center on scroll, or aligns left at top */}
            <div className={`transition-all duration-500 ease-in-out flex items-center ${
              isScrolled 
                ? 'absolute left-1/2 -translate-x-1/2 justify-center' 
                : 'justify-start'
            }`}>
              <BrandLogo 
                size="md"
                isScrolled={isScrolled}
                centered={isScrolled}
                onClick={() => handleNavClick('home')}
              />
            </div>

            {/* Right Slot: Cart shortcut when scrolled, or balanced spacer to keep logo dead-centered */}
            <div className={`flex items-center justify-end transition-all duration-400 ease-in-out ${
              isScrolled 
                ? 'opacity-100 scale-100 w-10' 
                : 'opacity-0 scale-75 w-0 overflow-hidden pointer-events-none'
            }`}>
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-10 h-10 relative flex items-center justify-center text-white border border-[#F25C05]/50 bg-black/50 hover:border-[#F25C05] transition-all cursor-pointer"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#F25C05]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#F25C05] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: ABOUT, EXCHANGE, SHOP, CART on Mobile (Dissolves when user starts scrolling) */}
          <div className={`grid grid-cols-4 gap-1.5 w-full transition-all duration-400 ease-in-out ${
            isScrolled 
              ? 'max-h-0 opacity-0 -translate-y-3 scale-95 overflow-hidden pointer-events-none py-0 m-0' 
              : 'max-h-16 opacity-100 translate-y-0 scale-100 pt-2 pb-1'
          }`}>
            {navItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`py-2 px-1 text-center text-[10px] sm:text-[11px] tracking-[0.14em] font-bold uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#F25C05] text-white shadow-[0_0_12px_rgba(242,92,5,0.4)] border border-[#F25C05]'
                      : 'bg-black/50 text-white/90 border border-[#F25C05]/60 hover:border-[#F25C05] hover:bg-[#F25C05]/20'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Top Cart Pill */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2 px-1 text-center text-[10px] sm:text-[11px] tracking-[0.14em] font-bold uppercase transition-all duration-200 cursor-pointer bg-black/50 text-white/90 border border-[#F25C05]/60 hover:border-[#F25C05] hover:bg-[#F25C05]/20 flex items-center justify-center gap-1"
            >
              <ShoppingBag className="w-3 h-3 text-[#F25C05]" />
              <span>CART</span>
              {totalCartCount > 0 && (
                <span className="bg-[#F25C05] text-white text-[9px] font-bold rounded-full px-1.5 py-0.2">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE DRAWER MENU (When Hamburger is Clicked) ==================== */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-[#F25C05]/30 px-6 py-6 transition-all animate-in slide-in-from-top duration-300 shadow-2xl">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full text-center py-3.5 text-sm tracking-[0.25em] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F25C05] text-white shadow-lg'
                      : 'border border-[#F25C05]/60 text-white hover:bg-[#F25C05]/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Cart inside drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsCartOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm tracking-[0.25em] font-bold text-white border border-[#F25C05] bg-[#F25C05]/15 hover:bg-[#F25C05]/25 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#F25C05]" />
              <span>SHOPPING CART</span>
              {totalCartCount > 0 && (
                <span className="bg-[#F25C05] text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
