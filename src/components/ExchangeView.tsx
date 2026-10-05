import React, { useState } from 'react';
import { ASSETS } from '../assets/images';
import TrustBadges from './TrustBadges';
import { RefreshCw, CheckCircle2, ShieldCheck, Clock, Truck } from 'lucide-react';

export const ExchangeView: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [exchangeReason, setExchangeReason] = useState('Need Different Size');
  const [preferredNewSize, setPreferredNewSize] = useState('XL');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId && phone) {
      setSubmitted(true);
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden py-24 sm:py-28">
      {/* Background - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="Sundarbans Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center fixed"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs tracking-[0.3em] uppercase text-[#F25C05] font-bold">
            Our Ironclad Guarantee
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] text-white mt-2">
            1-Month Exchange Policy
          </h1>
          <p className="text-xs sm:text-sm text-white font-bold tracking-widest mt-2">
            Zero Questions Asked • Instant Doorstep Swap
          </p>
          <div className="w-16 h-0.5 bg-[#F25C05] mx-auto mt-4" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-black/80 border border-white/15 text-center">
            <Clock className="w-8 h-8 text-[#F25C05] mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">30 Days Window</h3>
            <p className="text-xs text-neutral-200 font-bold mt-1">
              You have a full 30 days from delivery to request an exchange.
            </p>
          </div>

          <div className="p-5 bg-black/80 border border-white/15 text-center">
            <RefreshCw className="w-8 h-8 text-[#F25C05] mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">No Interrogation</h3>
            <p className="text-xs text-neutral-200 font-bold mt-1">
              Fit didn&apos;t match? Swapping size or shade? We process immediately.
            </p>
          </div>

          <div className="p-5 bg-black/80 border border-white/15 text-center">
            <Truck className="w-8 h-8 text-[#F25C05] mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Doorstep Pickup</h3>
            <p className="text-xs text-neutral-200 font-bold mt-1">
              Rider delivers replacement while picking up the previous piece.
            </p>
          </div>
        </div>

        {/* Interactive Exchange Request Form */}
        <div className="border border-white/20 bg-black/80 p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center mx-auto mb-4 text-[#F25C05]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-light text-white tracking-widest uppercase">
                Exchange Request Received
              </h3>
              <p className="text-xs text-neutral-300 font-extralight mt-2 max-w-md mx-auto">
                Our logistics manager will contact <span className="text-white font-mono">{phone}</span> within 2 hours to arrange your replacement shirt.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 px-6 py-2.5 border border-[#F25C05] text-[#F25C05] text-xs uppercase tracking-widest hover:bg-[#F25C05] hover:text-white transition-all cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-sm uppercase font-light tracking-[0.2em] text-[#F25C05] border-b border-white/10 pb-3">
                Request Quick Doorstep Exchange
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-300 font-extralight mb-1">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRB-104928"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/25 text-white text-xs tracking-wider font-mono focus:border-[#F25C05] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-300 font-extralight mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/25 text-white text-xs tracking-wider font-mono focus:border-[#F25C05] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-300 font-extralight mb-1">
                    Exchange Reason
                  </label>
                  <select
                    value={exchangeReason}
                    onChange={(e) => setExchangeReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/90 border border-white/25 text-white text-xs tracking-wider focus:border-[#F25C05] focus:outline-hidden"
                  >
                    <option value="Need Different Size">Need Different Size</option>
                    <option value="Prefer Different Color">Prefer Different Color</option>
                    <option value="Fit Adjustment">Fit Adjustment</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-300 font-extralight mb-1">
                    Preferred Replacement Size
                  </label>
                  <select
                    value={preferredNewSize}
                    onChange={(e) => setPreferredNewSize(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/90 border border-white/25 text-white text-xs tracking-wider focus:border-[#F25C05] focus:outline-hidden"
                  >
                    <option value="S">S (Length: 27.5&quot; | Chest: 38&quot;)</option>
                    <option value="M">M (Length: 28&quot; | Chest: 41&quot;)</option>
                    <option value="L">L (Length: 29.5&quot; | Chest: 42&quot;)</option>
                    <option value="XL">XL (Length: 30&quot; | Chest: 44&quot;)</option>
                    <option value="2XL">2XL (Length: 31&quot; | Chest: 46&quot;)</option>
                    <option value="3XL">3XL (Length: 32&quot; | Chest: 48&quot;)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="submit-exchange-button"
                className="w-full py-3.5 mt-2 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs font-light tracking-[0.25em] uppercase transition-all shadow-[0_4px_20px_rgba(242,92,5,0.4)] cursor-pointer"
              >
                Initiate Doorstep Exchange
              </button>
            </form>
          )}
        </div>

        {/* Badges */}
        <div className="mt-10">
          <TrustBadges variant="horizontal" />
        </div>
      </div>
    </section>
  );
};

export default ExchangeView;
