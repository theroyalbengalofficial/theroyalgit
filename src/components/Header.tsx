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
      // When scrollY is greater than 20px, mark as scrolled
      setIsScrolled(window.scrollY > 20);
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
      isScrolled ? 'bg-black/95 backdrop-blur-md shadow-lg py-0' : 'bg-black/90 py-1'
    }`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500 ${
        isScrolled ? 'h-16 md:h-20' : 'h-20 md:h-24'
      }`}>
        {/* Logo */}
        <BrandLogo 
          size="md"
          isScrolled={isScrolled}
          onClick={() => handleNavClick('home')}
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {navItems.map((item) => {
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                id={`nav-link-${item.page}`}
                onClick={() => handleNavClick(item.page)}
                className={`px-5 py-2 text-xs lg:text-sm tracking-[0.2em] font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[#F25C05] text-white shadow-[0_0_20px_rgba(242,92,5,0.4)]'
                    : 'bg-transparent text-white border border-[#F25C05]/80 hover:bg-[#F25C05]/20 hover:border-[#F25C05]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Cart Trigger */}
          <button
            id="cart-button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 ml-2 text-white/90 hover:text-white border border-[#F25C05]/50 hover:border-[#F25C05] bg-black/30 transition-all duration-300 group cursor-pointer"
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

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-white border border-[#F25C05]/70 bg-black/30"
          >
            <ShoppingBag className="w-5 h-5 text-[#F25C05]" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#F25C05] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white border border-white/20 bg-black/40"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#F25C05]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-white/10 px-6 py-6 transition-all animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full text-center py-3 text-sm tracking-[0.25em] font-bold transition-all ${
                    isActive
                      ? 'bg-[#F25C05] text-white'
                      : 'border border-[#F25C05]/60 text-white hover:bg-[#F25C05]/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
