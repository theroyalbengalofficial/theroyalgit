import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { OrderDetails, OrderStatus, ActivePage } from '../types';
import { storeService } from '../services/storeService';

interface TrackOrderViewProps {
  initialOrderId?: string;
  setActivePage?: (page: ActivePage) => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  initialOrderId,
  setActivePage,
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    return initialOrderId || localStorage.getItem('trb_last_order_id') || '';
  });

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [searched, setSearched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());

  // Search and find order from local storeService and remote server
  const findOrder = async (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) {
      setOrder(null);
      setSearched(false);
      return;
    }

    setIsRefreshing(true);
    setSearched(true);

    // 1. Check local store service first
    const localOrders = storeService.getOrders();
    let found = localOrders.find(
      (o) =>
        o.orderId.toUpperCase() === q ||
        o.orderId.toUpperCase() === `TRB-${q}` ||
        o.phone.trim() === query.trim()
    );

    // 2. Fetch fresh orders from server
    try {
      const serverOrders = await storeService.fetchOrders();
      if (serverOrders && Array.isArray(serverOrders)) {
        const remoteFound = serverOrders.find(
          (o) =>
            o.orderId.toUpperCase() === q ||
            o.orderId.toUpperCase() === `TRB-${q}` ||
            o.phone.trim() === query.trim()
        );
        if (remoteFound) {
          found = remoteFound;
        }
      }
    } catch (e) {
      console.warn('Could not query server orders:', e);
    }

    setOrder(found || null);
    setIsRefreshing(false);
    setLastUpdatedTime(new Date());

    if (found) {
      localStorage.setItem('trb_last_order_id', found.orderId);
    }
  };

  // Run on mount if initial query exists
  useEffect(() => {
    if (searchQuery) {
      findOrder(searchQuery);
    }
  }, []);

  // Listen to real-time order status updates (dispatched when Admin changes status in Admin Panel)
  useEffect(() => {
    const handleOrderUpdate = () => {
      if (searchQuery) {
        findOrder(searchQuery);
      }
    };

    window.addEventListener('trb_orders_updated', handleOrderUpdate);
    window.addEventListener('storage', handleOrderUpdate);

    // Also poll server every 4 seconds to catch updates made from any admin device
    const interval = setInterval(() => {
      if (searchQuery.trim()) {
        storeService.fetchOrders().then((allOrders) => {
          if (allOrders && Array.isArray(allOrders)) {
            const q = searchQuery.trim().toUpperCase();
            const matched = allOrders.find(
              (o) =>
                o.orderId.toUpperCase() === q ||
                o.orderId.toUpperCase() === `TRB-${q}` ||
                o.phone.trim() === searchQuery.trim()
            );
            if (matched) {
              setOrder(matched);
              setLastUpdatedTime(new Date());
            }
          }
        });
      }
    }, 4000);

    return () => {
      window.removeEventListener('trb_orders_updated', handleOrderUpdate);
      window.removeEventListener('storage', handleOrderUpdate);
      clearInterval(interval);
    };
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findOrder(searchQuery);
  };

  // Determine stage progression (0 to 3)
  const getStageIndex = (status: OrderStatus): number => {
    const s = status.toLowerCase();
    if (s === 'cancelled') return -1;
    if (s === 'completed') return 3;
    if (s === 'confirmed' || s === 'processing') return 1;
    if (s === 'shipped' || s === 'in_transit') return 2;
    return 0; // pending
  };

  const currentStage = order ? getStageIndex(order.status) : 0;
  const isCancelled = order?.status.toLowerCase() === 'cancelled';

  const stages = [
    {
      title: 'Order Placed',
      desc: 'Received and registered in executive queue',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Confirmed & Tailored',
      desc: 'Inspected for 100% export quality compliance',
      icon: <Package className="w-5 h-5" />,
    },
    {
      title: 'In Transit',
      desc: 'Dispatched via Dhaka Express delivery',
      icon: <Truck className="w-5 h-5" />,
    },
    {
      title: 'Delivered',
      desc: 'Safely delivered to customer doorstep',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  const getStatusBadge = (status: OrderStatus) => {
    const s = status.toLowerCase();
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-4 h-4" /> Delivered & Completed
        </span>
      );
    }
    if (s === 'confirmed' || s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold bg-sky-950/80 text-sky-400 border border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
          <Package className="w-4 h-4 animate-pulse" /> Processing & Packaging
        </span>
      );
    }
    if (s === 'shipped' || s === 'in_transit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold bg-purple-950/80 text-purple-400 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
          <Truck className="w-4 h-4 animate-bounce" /> In Transit (Out for Delivery)
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold bg-amber-950/80 text-amber-400 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <Clock className="w-4 h-4 animate-pulse" /> Pending Confirmation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-bold bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
        <XCircle className="w-4 h-4" /> Order Cancelled
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 selection:bg-[#F25C05] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F25C05]/10 border border-[#F25C05]/30 text-[#F25C05] text-[10px] sm:text-xs tracking-[0.25em] uppercase font-bold">
            <Truck className="w-3.5 h-3.5" />
            Live Shipment Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto font-light leading-relaxed">
            Enter your Order Number (e.g., <code className="text-[#F25C05] font-mono font-semibold">TRB-373078</code>) or phone number to check live order status and delivery updates.
          </p>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5 bg-neutral-950 p-2 sm:p-2.5 border border-[#F25C05]/40 shadow-[0_10px_35px_rgba(242,92,5,0.15)]"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Order # (e.g. TRB-373078) or Phone"
              className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-[#F25C05]"
            />
          </div>
          <button
            type="submit"
            disabled={isRefreshing}
            className="px-6 py-3 bg-[#F25C05] hover:bg-[#ff6910] active:scale-[0.98] text-white text-xs sm:text-sm tracking-[0.16em] uppercase font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <span>Track Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Results Container */}
        {searched && !order && (
          <div className="p-8 sm:p-12 bg-neutral-950 border border-white/10 text-center space-y-4 max-w-2xl mx-auto animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-950/50 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold uppercase tracking-wider text-white">
              No Order Found
            </h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-md mx-auto">
              We couldn't find an order matching <strong className="text-white font-mono">"{searchQuery}"</strong>. Please verify your order number received via SMS or enter the phone number used at checkout.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearched(false);
                }}
                className="text-xs uppercase tracking-wider text-[#F25C05] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {order && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Top Order Summary Card */}
            <div className="p-6 sm:p-8 bg-neutral-950 border border-white/10 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#F25C05] font-bold block mb-1">
                    Verified Royal Bengal Order
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wider">
                    {order.orderId}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                    Current Status:
                  </div>
                  {getStatusBadge(order.status)}
                  <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#F25C05]" />
                    Live Sync: {lastUpdatedTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              {isCancelled ? (
                <div className="p-4 bg-rose-950/30 border border-rose-500/40 text-center space-y-1">
                  <div className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                    This order has been cancelled
                  </div>
                  <p className="text-xs text-neutral-400 font-light">
                    If this is unexpected, please contact our concierge service below.
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  {/* Stepper Dots & Line */}
                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-6 right-6 h-0.5 bg-neutral-800 -translate-y-1/2 z-0 hidden sm:block" />
                    <div
                      className="absolute top-5 left-6 h-0.5 bg-[#F25C05] -translate-y-1/2 z-0 transition-all duration-700 hidden sm:block"
                      style={{
                        width: `${Math.min(100, (currentStage / (stages.length - 1)) * 90)}%`,
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                      {stages.map((stage, idx) => {
                        const isDone = idx < currentStage;
                        const isCurrent = idx === currentStage;

                        return (
                          <div
                            key={stage.title}
                            className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-2 sm:p-0 transition-all ${
                              isCurrent
                                ? 'scale-100 sm:scale-105'
                                : idx > currentStage
                                ? 'opacity-40'
                                : 'opacity-90'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                isDone
                                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                                  : isCurrent
                                  ? 'bg-[#F25C05] border-[#F25C05] text-white shadow-[0_0_18px_rgba(242,92,5,0.6)] animate-pulse'
                                  : 'bg-black/60 border-neutral-700 text-neutral-500'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-5 h-5" /> : stage.icon}
                            </div>

                            <div>
                              <div
                                className={`text-xs uppercase tracking-wider font-bold ${
                                  isCurrent
                                    ? 'text-[#F25C05]'
                                    : isDone
                                    ? 'text-white'
                                    : 'text-neutral-400'
                                }`}
                              >
                                {stage.title}
                              </div>
                              <div className="text-[10px] text-neutral-400 font-light mt-0.5 max-w-[160px] sm:mx-auto">
                                {stage.desc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Details & Items Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                {/* Shipping Destination */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F25C05] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    Delivery Destination
                  </h4>
                  <div className="bg-black/40 border border-white/10 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-mono">{order.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-neutral-300">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span>{order.address}</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Delivery Zone:</span>
                      <span className="text-white font-medium capitalize">
                        {order.deliveryZone ? `${order.deliveryZone} Dhaka` : 'Inside Dhaka'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Payment Method:</span>
                      <span className="text-[#F25C05] font-semibold uppercase flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F25C05] flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    Garment Package ({order.items?.length || 0} items)
                  </h4>
                  <div className="bg-black/40 border border-white/10 p-4 space-y-3 max-h-[220px] overflow-y-auto">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-b-0 last:pb-0"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-14 object-cover object-top border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white text-xs font-medium truncate">
                            {item.product.name}
                          </h5>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Size: <span className="text-white font-bold">{item.selectedSize}</span> · Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="text-xs text-white font-mono font-semibold shrink-0">
                          Tk. {(item.product.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount Pill */}
                  <div className="p-3 bg-neutral-900 border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 uppercase tracking-wider font-medium">
                      Total Payable Amount
                    </span>
                    <span className="text-[#F25C05] text-base font-extrabold font-mono">
                      Tk. {order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust & Guarantee Banner */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F25C05]" />
                  <span>Backed by 1-Month Hassle-Free Exchange Guarantee</span>
                </div>

                {setActivePage && (
                  <button
                    onClick={() => setActivePage('shop')}
                    className="text-white hover:text-[#F25C05] text-xs uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Continue Shopping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderView;
