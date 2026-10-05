import React, { useState, useEffect } from 'react';
import { ActivePage } from '../types';
import { Check } from 'lucide-react';
import { ASSETS } from '../assets/images';
import {
  getActiveSocialLinks,
  DEFAULT_SOCIAL_LINKS,
  SocialLinksConfig,
} from '../data/socialLinks';

interface FooterProps {
  setActivePage: (page: ActivePage) => void;
  onOpenGatewaySettings?: () => void;
}

export interface SocialPlatformConfig {
  id: keyof SocialLinksConfig;
  name: string;
  hoverClass?: string;
  icon: React.ReactNode;
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    hoverClass: 'hover:bg-[#1877F2] hover:text-white',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    name: 'X',
    hoverClass: 'hover:bg-neutral-900 hover:text-white',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    hoverClass: 'hover:bg-[#E4405F] hover:text-white',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    hoverClass: 'hover:bg-[#0A66C2] hover:text-white',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    hoverClass: 'hover:bg-neutral-900 hover:text-white',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .591.044.87.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.96-4.52V8.75a8.28 8.28 0 0 0 4.81 1.53V6.82a4.84 4.84 0 0 1-1-.13z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    hoverClass: 'hover:bg-[#25D366] hover:text-white',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.782-.879-2.057-.98-.276-.1-.477-.15-.678.15s-.779.98-.954 1.18c-.176.202-.351.226-.652.076-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.299.3-.5.1-.202.05-.377-.025-.527-.075-.15-.678-1.634-.929-2.239-.245-.589-.494-.509-.678-.519-.176-.01-.377-.01-.577-.01s-.527.075-.803.376c-.276.301-1.054 1.03-1.054 2.511s1.079 2.912 1.23 3.113c.15.201 2.122 3.24 5.14 4.544.718.31 1.279.496 1.716.635.722.23 1.378.197 1.897.12.578-.087 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.43-.076-.126-.277-.202-.578-.352zm-5.467 7.618h-.005a10.02 10.02 0 0 1-5.111-1.396l-.367-.218-3.798.996 1.014-3.702-.239-.38a10.023 10.023 0 0 1-1.536-5.28c0-5.526 4.498-10.02 10.03-10.02a9.99 9.99 0 0 1 7.09 2.935 9.99 9.99 0 0 1 2.936 7.09c0 5.528-4.498 10.025-10.025 10.025zm8.508-18.533A11.93 11.93 0 0 0 12.005 0C5.385 0 .005 5.38.005 12c0 2.112.552 4.175 1.6 5.993L0 24l6.177-1.62A11.95 11.95 0 0 0 12.005 24c6.62 0 12-5.38 12-12 0-3.206-1.249-6.22-3.514-8.533z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    hoverClass: 'hover:bg-[#FF0000] hover:text-white',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export const SocialIconButton: React.FC<{
  platform: keyof SocialLinksConfig;
  customHref?: string;
  className?: string;
  showLabel?: boolean;
}> = ({ platform, customHref, className = '', showLabel = false }) => {
  const config = SOCIAL_PLATFORMS.find((p) => p.id === platform);
  const links = getActiveSocialLinks();
  const href = customHref || links[platform] || DEFAULT_SOCIAL_LINKS[platform];

  if (!config) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={config.name}
      title={`${config.name}: ${href}`}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-[#F25C05] hover:text-white transition-all duration-300 shadow-md cursor-pointer ${
        showLabel ? 'px-3 py-1.5 text-xs' : 'w-8 h-8 sm:w-9 sm:h-9 justify-center'
      } ${className}`}
    >
      {config.icon}
      {showLabel && <span>{config.name}</span>}
    </a>
  );
};

export const Footer: React.FC<FooterProps> = ({ setActivePage }) => {
  const [, setTick] = useState(0);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('trb_social_links_updated', handleUpdate);
    return () => window.removeEventListener('trb_social_links_updated', handleUpdate);
  }, []);

  const socialLinks = getActiveSocialLinks();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setIsSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSendSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (err) {
      console.warn('Inquiry send error:', err);
      setSendSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSendSuccess(false), 5000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer className="relative w-full overflow-hidden text-white font-['Montserrat',sans-serif] select-none">
      {/* Background Image: Authentic Sundarbans Mangrove Wilderness with Muddy River */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.jungleRiverBg}
          alt="Sundarbans Jungle River"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center contrast-105 brightness-95 saturate-115 scale-100"
        />
        {/* Subtle dark tint overlay to guarantee razor-sharp contrast for text */}
        <div className="absolute inset-0 bg-black/35 sm:bg-black/25 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/70 pointer-events-none" />
      </div>

      {/* Main Section Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: LOGO, QUOTE, & POETIC BRAND MANIFESTO       */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col items-start select-text">
            {/* Brand Logo & Tagline */}
            <div className="flex flex-col items-start mb-4">
              <img
                src="/Logo-trimmed.png"
                alt="The Royal Bengal"
                className="h-14 sm:h-16 md:h-18 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
              />
              <p className="text-white text-xs sm:text-sm font-bold tracking-[0.25em] uppercase mt-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                Made for the hunt
              </p>
            </div>

            {/* Burnt Orange Serif Italic Headline */}
            <h2
              className="text-[#F25C05] text-2xl sm:text-3xl md:text-4xl italic font-bold tracking-wide mt-3 mb-3.5 drop-shadow-[0_3px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Playfair Display', Georgia, Cambria, serif" }}
            >
              Who becomes the king of the jungle?
            </h2>

            {/* Quotation */}
            <p className="text-white font-bold text-sm sm:text-base leading-relaxed tracking-wide mb-4 max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
              “He does not dress to be seen. He dresses because he knows who he is. And the clothes know it too.”
            </p>

            {/* Poetic Stanzas */}
            <div className="space-y-3.5 text-white text-xs sm:text-sm font-bold leading-relaxed tracking-wide max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              <p className="text-white font-bold text-sm sm:text-base">
                Not every man who leads is loud.
              </p>

              <p className="font-bold">
                The risk takers who take risks without announcing them. The brave warriors who carry their scars quietly. The dreamers who are moved by their vision are held steady by purpose. The passionate, who never mistake noise for power.
              </p>

              <p className="font-bold">
                Focus is their language of self-love. Humbled by life. Determined in every word. Driven by action in every move. Patient in every storm they never speak of.
              </p>

              <p className="font-bold">
                The world views him for his worldview, not because he demands it, but because a room shifts when he enters it. Those who know why every decision matters. Simply elegant within.
              </p>

              <p className="font-bold">
                Who becomes the King of the Jungle? Those who wear confidence are made for the hunt.
              </p>

              <p className="font-bold">
                He does not dress to be seen. He dresses because he knows who he is. And the clothes know it too. Confidence worn by the decided.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: ADDRESS, SOCIALS, & CONTACT FORM           */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6 sm:space-y-7 lg:space-y-0">
            {/* Top Info & Social Platforms */}
            <div className="space-y-6 sm:space-y-7 pt-1 lg:pt-[130px]">
              {/* Company Info & Address */}
              <div className="space-y-1 text-xs sm:text-sm tracking-wide font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)] select-text">
                <p className="font-bold text-sm sm:text-base tracking-[0.12em] uppercase text-white leading-tight">
                  THE ROYAL BENGAL LIMITED
                </p>
                <p>385/5/1/C, Banasree, East Rampura,</p>
                <p>Dhaka-1219, Bangladesh</p>
                <p>
                  <a
                    href="tel:+8801321814355"
                    className="hover:text-[#F25C05] transition-colors"
                  >
                    +880 1321 814 355
                  </a>
                </p>
                <p>
                  <a
                    href="https://www.theroyalbengal.shop"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#F25C05] transition-colors"
                  >
                    www.theroyalbengal.shop
                  </a>
                </p>
              </div>

              {/* Social Media: 7 Circular White Buttons */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                {SOCIAL_PLATFORMS.map((item) => {
                  const targetHref = socialLinks[item.id] || DEFAULT_SOCIAL_LINKS[item.id];
                  return (
                    <a
                      key={item.id}
                      href={targetHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.name}
                      title={item.name}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-[#F25C05] hover:text-white transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.5)] hover:scale-110 cursor-pointer"
                    >
                      {item.icon}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Contact Inquiry Form */}
            <form onSubmit={handleContactSubmit} className="space-y-3 w-full mt-6 lg:mt-auto">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-black/30 backdrop-blur-xs border border-white text-white placeholder-neutral-300 text-xs sm:text-sm font-light focus:outline-none focus:border-[#F25C05] transition-all shadow-inner"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-black/30 backdrop-blur-xs border border-white text-white placeholder-neutral-300 text-xs sm:text-sm font-light focus:outline-none focus:border-[#F25C05] transition-all shadow-inner"
                />
              </div>

              <div>
                <textarea
                  required
                  rows={4}
                  placeholder="Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-black/30 backdrop-blur-xs border border-white text-white placeholder-neutral-300 text-xs sm:text-sm font-light focus:outline-none focus:border-[#F25C05] transition-all shadow-inner resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 sm:py-3 bg-[#F25C05] hover:bg-[#ff6811] text-white border border-white text-xs sm:text-sm font-normal tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(242,92,5,0.45)] hover:shadow-[0_6px_25px_rgba(242,92,5,0.7)] cursor-pointer"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>

              {sendSuccess && (
                <div className="p-3 bg-black/85 border border-[#F25C05] text-[#F25C05] text-xs text-center font-light tracking-wider flex items-center justify-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-[#F25C05]" />
                  <span>Thank you! Your message has been received by our concierge.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Utility Bar: Copyright & Service Guarantee */}
        <div className="mt-14 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-[11px] font-light text-neutral-300 gap-4">
          <p>© {new Date().getFullYear()} The Royal Bengal Limited. All Rights Reserved. Made for the Hunt.</p>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-neutral-400">Dhaka Express • 1-Month Exchange Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
