import React, { useState, useEffect } from 'react';
import BrandLogo from './Logo';
import { CartItem, OrderDetails, PaymentGatewayKeys, DeliveryZone } from '../types';
import { ASSETS } from '../assets/images';
import { TrustBadges } from './TrustBadges';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { storeService } from '../services/storeService';
import {
  ShieldCheck,
  Truck,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  Tag,
  ChevronRight,
  User,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';

interface CheckoutSectionProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  gatewayKeys: PaymentGatewayKeys;
  onOpenGatewaySettings: () => void;
  onOrderCompleted: (order: OrderDetails) => void;
}

export const CheckoutSection: React.FC<CheckoutSectionProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOrderCompleted,
}) => {
  const {
    customer,
    updateProfile,
  } = useCustomerAuth();

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Customer shipping details (prefilled from logged in customer if available)
  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>(
    customer?.deliveryZone || 'inside-dhaka'
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Checkout submission states
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Sync customer auth updates into the form fields
  useEffect(() => {
    if (customer) {
      if (!customerName) setCustomerName(customer.name);
      if (!email) setEmail(customer.email);
      if (!phone && customer.phone) setPhone(customer.phone);
      if (!address && customer.address) setAddress(customer.address);
      if (customer.deliveryZone) setDeliveryZone(customer.deliveryZone);
    }
  }, [customer]);

  // Calculations
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const discount = Math.round(subtotal * (discountPercent / 100));

  // Delivery charges: Inside Dhaka = 100 Tk, Outside Dhaka = 150 Tk
  const shippingFee = deliveryZone === 'inside-dhaka' ? 100 : 150;
  const total = Math.max(0, subtotal - discount + shippingFee);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'HUNT10' || code === 'BENGAL10') {
      setDiscountPercent(10);
      setPromoMessage('10% Hunt Discount applied successfully!');
    } else if (code === 'VIP500') {
      setDiscountPercent(15);
      setPromoMessage('VIP Ambitious Discount applied!');
    } else {
      setPromoMessage('Invalid promo code. Try "HUNT10"');
    }
  };

  // Place order directly with basic customer contact info
  const handlePlaceOrder = () => {
    setFormError(null);

    const availableProducts = storeService.getProducts();
    const fallbackProduct = availableProducts[0] || {
      id: '1',
      name: 'The Apex Egyptian Cotton',
      subtitle: 'Formal Egyptian Giza 87 / Semi-Formal Elegance',
      price: 3800,
      currency: 'BDT',
      image: '/assets/model-shirt.webp',
      category: 'boardroom',
      fabric: 'Egyptian Giza 87 Cotton (120/2 Ply)',
      stock: 50,
      styleCode: 'TRB-EGY-001',
    };

    const finalOrderItems = cartItems.length > 0 ? [...cartItems] : [
      {
        id: `cart-auto-${Date.now()}`,
        product: fallbackProduct,
        selectedSize: 'L',
        selectedColor: 'Midnight Navy',
        quantity: 1,
      }
    ];

    const finalSubtotal = finalOrderItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const finalTotal = finalSubtotal - discount + shippingFee;

    // Basic contact info validation: Name, Phone, and Address
    if (!customerName.trim()) {
      setFormError('Please provide your Full Name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide your Bangladeshi Phone Number (e.g. 01712345678).');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide your delivery address (House, Road, Area).');
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      // Generate clean unique Order Number
      const generatedOrderNumber = `TRB-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder: OrderDetails = {
        orderId: generatedOrderNumber,
        orderNumber: generatedOrderNumber,
        customerId: customer?.id || `cust-${phone.trim().replace(/[^0-9]/g, '') || Date.now()}`,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || (customer?.email || ''),
        address: address.trim(),
        district: deliveryZone === 'inside-dhaka' ? 'Dhaka' : 'Outside Dhaka',
        deliveryMethod: deliveryZone,
        paymentMethod: 'cod',
        authProvider: customer?.provider || 'direct',
        items: finalOrderItems,
        subtotal: finalSubtotal,
        discount,
        vat: 0,
        shipping: shippingFee,
        total: finalTotal,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      // Persist order in storeService (syncs to localStorage and immediately to server endpoints)
      try {
        await storeService.addOrderAsync(newOrder);
      } catch (saveErr) {
        console.warn('Background save error:', saveErr);
        storeService.addOrder(newOrder);
      }

      // If customer profile exists, update cache
      if (updateProfile) {
        try {
          updateProfile({
            name: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            district: deliveryZone === 'inside-dhaka' ? 'Dhaka' : 'Outside Dhaka',
            deliveryZone,
          });
        } catch (e) {}
      }

      setIsProcessing(false);
      setCompletedOrder(newOrder);
      onOrderCompleted(newOrder);
    }, 400);
  };

  // Completed Order View
  if (completedOrder) {
    return (
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center py-28 px-4">
        {/* Background - Restored 100% visibility with 5% subtle blur */}
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

        <div className="relative z-10 max-w-xl w-full bg-neutral-950/95 border-2 border-[#F25C05] p-8 sm:p-10 text-center shadow-[0_15px_40px_rgba(242,92,5,0.3)]">
          <div className="flex justify-center mb-6">
            <BrandLogo size="md" />
          </div>

          <div className="w-14 h-14 rounded-full bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center mx-auto mb-4 text-[#F25C05]">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="text-xs font-light tracking-[0.3em] uppercase text-[#F25C05]">
            Order Successfully Placed
          </span>

          <div className="mt-2 flex items-center justify-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-mono font-medium text-white tracking-widest">
              {completedOrder.orderId}
            </h2>
            <button
              onClick={() => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(completedOrder.orderId);
                }
                setCopiedOrderNumber(true);
                setTimeout(() => setCopiedOrderNumber(false), 2000);
              }}
              className="p-1.5 border border-[#F25C05]/60 hover:border-[#F25C05] bg-black/60 text-[#F25C05] hover:text-white transition-colors cursor-pointer"
              title="Copy Order Number"
            >
              {copiedOrderNumber ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {copiedOrderNumber && (
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono block mt-1">
              ✓ Order Number Copied
            </span>
          )}

          <p className="mt-4 text-xs sm:text-sm text-neutral-300 font-extralight leading-relaxed tracking-wider">
            Thank you, <span className="text-white font-normal">{completedOrder.customerName}</span>. Your order has been recorded in the executive queue and will be dispatched promptly.
          </p>

          <div className="mt-6 p-4 bg-white/5 border border-white/10 text-left text-xs font-extralight space-y-2 text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-400">Order Number:</span>
              <span className="text-[#F25C05] uppercase font-mono font-medium">
                {completedOrder.orderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Recipient Name:</span>
              <span className="text-white font-medium">{completedOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Contact Phone:</span>
              <span className="text-white font-mono">{completedOrder.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Delivery Zone:</span>
              <span className="text-white font-medium">
                {completedOrder.deliveryMethod === 'inside-dhaka'
                  ? 'Inside Dhaka (৳100)'
                  : 'Outside Dhaka (৳150)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Payment Option:</span>
              <span className="text-emerald-400 font-medium">Cash on Delivery (Pay upon arrival)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Subtotal:</span>
              <span className="text-white">Tk. {completedOrder.subtotal}</span>
            </div>
            {completedOrder.discount > 0 && (
              <div className="flex justify-between text-[#F25C05]">
                <span>Discount:</span>
                <span>- Tk. {completedOrder.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-400">Delivery Charge:</span>
              <span className="text-white">Tk. {completedOrder.shipping}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-sm">
              <span className="text-white font-normal">Total Payable:</span>
              <span className="text-[#F25C05] font-bold">Tk. {completedOrder.total}</span>
            </div>
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="text-neutral-400 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#F25C05] flex-shrink-0 mt-0.5" />
                <span className="text-white">{completedOrder.address}, {completedOrder.district}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs tracking-[0.2em] uppercase font-light cursor-pointer shadow-lg"
            >
              Continue Exploring The Hunt
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden py-24 sm:py-28">
      {/* Background with Mangrove roots - Restored 100% visibility with 5% subtle blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.heroBg}
          alt="Mangrove Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center fixed"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 opacity-0 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Product Summary */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="border-2 border-[#F25C05] bg-neutral-950/90 p-4 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-sm sm:text-base font-light tracking-[0.2em] uppercase text-white">
                  Hunt Cart Summary
                </h3>
                <span className="text-xs text-[#F25C05] tracking-widest font-mono">
                  {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 font-extralight text-sm">
                  Your hunt cart is empty.
                </div>
              ) : (
                <div className="divide-y divide-white/10 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-20 aspect-[3/4] border border-[#F25C05]/60 bg-black overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-normal text-white tracking-wide">
                            {item.product.name}
                          </h4>
                          <div className="text-xs text-neutral-400 font-light">
                            {item.product.subtitle}
                          </div>
                          <div className="text-[11px] text-[#F25C05] font-mono mt-0.5">
                            Style Code: {item.product.styleCode}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            Color: <span className="text-white">{item.selectedColor}</span> | Size:{' '}
                            <span className="text-white">{item.selectedSize}</span>
                          </div>
                        </div>

                        {/* Stepper + Price */}
                        <div className="flex items-center justify-between mt-3 pt-2">
                          <div className="text-sm font-light text-white tracking-wider">
                            Tk. {item.product.price}
                          </div>

                          <div className="flex items-center border border-[#F25C05] bg-black/70">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="px-2.5 py-1 text-[#F25C05] hover:bg-[#F25C05] hover:text-white transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-1 text-xs text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="px-2.5 py-1 text-[#F25C05] hover:bg-[#F25C05] hover:text-white transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Promos & Vouchers Bar */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPromoInput(!showPromoInput)}
                  className="w-full py-3 px-4 bg-[#F25C05] text-white text-xs font-light tracking-[0.2em] uppercase flex items-center justify-between hover:bg-[#ff6811] transition-all cursor-pointer shadow-[0_4px_15px_rgba(242,92,5,0.3)]"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    Promos &amp; Vouchers
                  </span>
                  <span className="text-[11px] font-extralight flex items-center gap-1">
                    Enter Voucher Code <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                {showPromoInput && (
                  <form onSubmit={applyPromo} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. HUNT10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/70 border border-white/30 text-white text-xs uppercase tracking-widest font-mono focus:border-[#F25C05] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-[#F25C05] text-[#F25C05] hover:bg-[#F25C05] hover:text-white text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {promoMessage && (
                  <div
                    className={`mt-2 text-xs tracking-wider ${
                      discountPercent > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {promoMessage}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs font-extralight tracking-wider">
                <div className="flex justify-between text-neutral-300">
                  <span>Subtotal</span>
                  <span>Tk. {subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#F25C05]">
                    <span>Discount ({discountPercent}%)</span>
                    <span>- Tk. {discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-300">
                  <span>
                    Delivery Charge ({deliveryZone === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span className="font-mono text-white">Tk. {shippingFee}</span>
                </div>
                <div className="flex items-baseline justify-between pt-3 border-t border-white/15">
                  <div>
                    <div className="text-base font-normal text-white">Total Amount</div>
                    <div className="text-[10px] text-neutral-400">All Taxes &amp; Delivery Included</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-light text-white tracking-wider">
                      Tk. <span className="text-[#F25C05] font-normal">{total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <TrustBadges variant="compact" />
              </div>

              {/* Order Placement Trigger */}
              <div className="mt-8">
                <button
                  id="end-of-hunt-button"
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || isProcessing}
                  className="w-full py-4 bg-[#F25C05] hover:bg-[#ff6811] disabled:opacity-50 text-white text-sm sm:text-base font-light tracking-[0.25em] uppercase transition-all shadow-[0_6px_25px_rgba(242,92,5,0.45)] cursor-pointer text-center"
                >
                  {isProcessing ? 'Confirming Order...' : 'Confirm & Place Order'}
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-3 bg-rose-500/15 border border-rose-500 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Authentication & Order Placement Details */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="border-2 border-[#F25C05]/60 hover:border-[#F25C05] bg-neutral-950/95 backdrop-blur-md p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.95)] transition-all">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium tracking-[0.15em] text-white uppercase">
                    Checkout &amp; Delivery Information
                  </h3>
                  <p className="text-xs text-neutral-300 font-light mt-0.5">
                    Direct cash-on-delivery across Bangladesh
                  </p>
                </div>
                <span className="text-xs text-[#F25C05] font-light flex items-center gap-1.5 px-2.5 py-1 bg-[#F25C05]/10 border border-[#F25C05]/30">
                  <Lock className="w-3.5 h-3.5 text-[#F25C05]" /> Encrypted Checkout
                </span>
              </div>

              {/* Customer Information & Direct Checkout Guidance Banner */}
              <div className="p-4 bg-black/80 border border-[#F25C05]/50 mb-6 flex items-start gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-none bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center text-[#F25C05] shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white">
                    Direct Order &bull; Cash On Delivery
                  </h4>
                  <p className="text-[12px] text-neutral-200 font-normal mt-0.5 leading-relaxed">
                    Provide your Full Name, Phone Number, and Delivery Address below. Your order will be assigned an official tracking number and dispatched promptly.
                  </p>
                </div>
              </div>

              {/* Customer Basic Info Form */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white font-medium mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asif Mahmud"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 bg-black/90 border border-white/30 text-white placeholder-neutral-400 text-xs sm:text-sm tracking-wider focus:border-[#F25C05] focus:ring-1 focus:ring-[#F25C05] focus:outline-hidden font-light transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white font-medium mb-1.5">
                      Phone Number (BD) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-black/90 border border-white/30 text-white placeholder-neutral-400 text-xs sm:text-sm tracking-wider font-mono focus:border-[#F25C05] focus:ring-1 focus:ring-[#F25C05] focus:outline-hidden font-light transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white font-medium mb-1.5">
                    Email Address <span className="text-neutral-400 text-[10px] normal-case tracking-normal">(Optional for invoice copy)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="customer@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/90 border border-white/30 text-white placeholder-neutral-400 text-xs sm:text-sm tracking-wider focus:border-[#F25C05] focus:ring-1 focus:ring-[#F25C05] focus:outline-hidden font-light transition-all"
                  />
                </div>

                {/* TWO DELIVERY OPTIONS: INSIDE DHAKA (100 TK) & OUTSIDE DHAKA (150 TK) */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white font-medium mb-2">
                    Delivery Zone &amp; Shipping Charges *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Inside Dhaka (100 Tk) */}
                    <div
                      onClick={() => setDeliveryZone('inside-dhaka')}
                      className={`p-4 border cursor-pointer transition-all ${
                        deliveryZone === 'inside-dhaka'
                          ? 'border-[#F25C05] bg-[#F25C05]/20 text-white shadow-[0_0_25px_rgba(242,92,5,0.35)] ring-1 ring-[#F25C05]'
                          : 'border-white/25 bg-black/60 text-neutral-300 hover:border-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs uppercase font-medium tracking-wider text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#F25C05]" />
                          Inside Dhaka
                        </span>
                        <span className="text-xs font-mono text-white font-bold bg-[#F25C05] px-2 py-0.5 border border-[#F25C05]">
                          Tk. 100
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-200 leading-relaxed font-light">
                        Dhaka City Corporation areas (Gulshan, Banani, Dhanmondi, Uttara, Mirpur, Motijheel, etc.).
                      </p>
                    </div>

                    {/* Option 2: Outside Dhaka (150 Tk) */}
                    <div
                      onClick={() => setDeliveryZone('outside-dhaka')}
                      className={`p-4 border cursor-pointer transition-all ${
                        deliveryZone === 'outside-dhaka'
                          ? 'border-[#F25C05] bg-[#F25C05]/20 text-white shadow-[0_0_25px_rgba(242,92,5,0.35)] ring-1 ring-[#F25C05]'
                          : 'border-white/25 bg-black/60 text-neutral-300 hover:border-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs uppercase font-medium tracking-wider text-white flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#F25C05]" />
                          Outside Dhaka
                        </span>
                        <span className="text-xs font-mono text-white font-bold bg-[#F25C05] px-2 py-0.5 border border-[#F25C05]">
                          Tk. 150
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-200 leading-relaxed font-light">
                        Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Gazipur, Narayanganj &amp; all districts.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white font-medium mb-1.5">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House/Holding number, Road, Area, Landmark..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-black/90 border border-white/30 text-white placeholder-neutral-400 text-xs sm:text-sm tracking-wider focus:border-[#F25C05] focus:ring-1 focus:ring-[#F25C05] focus:outline-hidden font-light transition-all"
                  />
                </div>

                {/* PAYMENT METHOD SELECTION */}
                <div className="pt-4 border-t border-white/15">
                  <label className="block text-xs uppercase tracking-widest text-white font-medium mb-2.5">
                    Payment Gateway Selection
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* bKash (coming soon) */}
                    <div
                      className="p-3.5 border border-white/15 bg-white/5 opacity-50 cursor-not-allowed flex flex-col items-center justify-center text-center select-none"
                      title="bKash direct payment gateway integration is coming soon"
                    >
                      <div className="font-bold text-[#E2136E] text-sm mb-1 font-sans">
                        bKash (coming soon)
                      </div>
                      <span className="text-[10px] text-neutral-400">Direct Gateway</span>
                    </div>

                    {/* Nagad (coming soon) */}
                    <div
                      className="p-3.5 border border-white/15 bg-white/5 opacity-50 cursor-not-allowed flex flex-col items-center justify-center text-center select-none"
                      title="Nagad direct payment gateway integration is coming soon"
                    >
                      <div className="font-bold text-[#F7921E] text-sm mb-1 font-sans">
                        Nagad (coming soon)
                      </div>
                      <span className="text-[10px] text-neutral-400">Direct Gateway</span>
                    </div>

                    {/* Cash on Delivery (Active) */}
                    <div
                      className="p-3.5 border-2 border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex flex-col items-center justify-center text-center cursor-default"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-xs uppercase tracking-wider mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Cash on Delivery</span>
                      </div>
                      <span className="text-[11px] text-white font-medium">
                        Pay Tk. {total > 0 ? total : (cartItems.length ? total : 3900)} on delivery
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white/10 border border-white/15 text-xs text-neutral-200 font-light flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      bKash &amp; Nagad are currently in testing. Please provide your basic information (Name, Phone number, Address) to place your order with <strong>Cash on Delivery</strong>.
                    </span>
                  </div>
                </div>

                {/* Direct Order Confirmation Button right inside this customer form card */}
                <div className="pt-6 border-t border-white/15">
                  <button
                    id="checkout-confirm-order-button"
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full py-4.5 bg-[#F25C05] hover:bg-[#ff6811] disabled:opacity-50 text-white text-sm sm:text-base font-medium tracking-[0.25em] uppercase transition-all shadow-[0_8px_30px_rgba(242,92,5,0.55)] hover:shadow-[0_10px_40px_rgba(242,92,5,0.7)] cursor-pointer text-center flex items-center justify-center gap-2.5 active:scale-[0.99]"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming &amp; Dispatching Order...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Confirm &amp; Place Order &bull; Tk. {total > 0 ? total : (cartItems.length ? total : 3900)}</span>
                      </>
                    )}
                  </button>

                  {formError && (
                    <div className="mt-3 p-3.5 bg-rose-500/20 border-2 border-rose-500 text-rose-200 text-xs flex items-center gap-2.5 animate-in shake duration-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <span className="font-medium">{formError}</span>
                    </div>
                  )}

                  <div className="mt-3 text-center text-[11px] text-neutral-300 font-light tracking-wider">
                    🔒 Official Royal Bengal Tracking Number will be issued immediately upon confirmation and recorded in Admin.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutSection;
