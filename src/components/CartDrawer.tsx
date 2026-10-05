import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-950 border-l border-[#F25C05]/60 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#F25C05]" />
              <h2 className="text-sm font-light tracking-[0.2em] uppercase text-white">
                Your Hunt Cart ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <ShoppingBag className="w-12 h-12 text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-400 font-extralight tracking-wider">
                  Your cart is currently empty.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-[#F25C05] text-white text-xs uppercase tracking-widest font-light"
                >
                  Start Your Hunt
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-black/50 border border-white/10"
                >
                  <div className="w-16 aspect-[3/4] border border-[#F25C05]/40 overflow-hidden bg-black flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-normal text-white truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-neutral-400 font-extralight">
                        {item.selectedColor} | Size: {item.selectedSize}
                      </div>
                      <div className="text-[11px] text-[#F25C05] font-mono mt-0.5">
                        Tk. {item.product.price}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-white/20 bg-black">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs text-white font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-0.5 text-neutral-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-500 hover:text-rose-400"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Subtotal & Proceed */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-black/60 space-y-4">
              <div className="flex items-center justify-between text-sm font-light text-neutral-300">
                <span>Subtotal (Incl. VAT)</span>
                <span className="text-white font-mono text-base">Tk. {subtotal}</span>
              </div>
              <div className="text-[11px] text-neutral-400 font-extralight">
                ⚡ 2-Hour Express Delivery inside Dhaka available at checkout
              </div>
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs tracking-[0.25em] uppercase font-light transition-all shadow-[0_4px_20px_rgba(242,92,5,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
