import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import VideoHeroSection from './VideoHeroSection';
import HeroSection from './HeroSection';
import ChooseYourHunt from './ChooseYourHunt';
import NewArrivals from './NewArrivals';
import ShopCatalog from './ShopCatalog';
import ProductDetail from './ProductDetail';
import CheckoutSection from './CheckoutSection';
import AboutView from './AboutView';
import ExchangeView from './ExchangeView';
import CartDrawer from './CartDrawer';
import GatewaySettingsModal from './GatewaySettingsModal';
import { CustomerAuthModal } from './CustomerAuthModal';
import { AIChatbot } from './AIChatbot';

import { storeService } from '../services/storeService';
import { Product, CartItem, ActivePage, HuntCategory, PaymentGatewayKeys, OrderDetails } from '../types';

export const Storefront: React.FC = () => {
  // Real-time products from the store service (reflects Admin additions/edits/deletions)
  const [products, setProducts] = useState<Product[]>(() => storeService.getProducts());

  // Fetch live products from server on mount (ensures Incognito & all external devices see the catalog)
  useEffect(() => {
    storeService.fetchProducts().then((remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(remoteProducts);
      }
    });
  }, []);

  // Listen to product updates from Admin dashboard
  useEffect(() => {
    const handleProductsUpdate = (e: any) => {
      if (e.detail) {
        setProducts(e.detail);
      } else {
        setProducts(storeService.getProducts());
      }
    };

    window.addEventListener('trb_products_updated', handleProductsUpdate);
    window.addEventListener('storage', handleProductsUpdate);
    return () => {
      window.removeEventListener('trb_products_updated', handleProductsUpdate);
      window.removeEventListener('storage', handleProductsUpdate);
    };
  }, []);

  // Navigation State
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedCategory, setSelectedCategory] = useState<HuntCategory | 'all'>('signature');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => products[0] || null);

  // Synchronize default selected product if products change
  useEffect(() => {
    if (products.length > 0) {
      if (!selectedProduct || !products.find((p) => p.id === selectedProduct.id)) {
        setSelectedProduct(products[0]);
      }
    }
  }, [products]);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('trb_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Gateway Keys State
  const [gatewayKeys, setGatewayKeys] = useState<PaymentGatewayKeys>(() => {
    const saved = localStorage.getItem('trb_gateway_keys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      bkashMerchantId: '',
      bkashAppKey: '',
      bkashAppSecret: '',
      bkashUsername: '',
      bkashPassword: '',
      nagadMerchantId: '',
      nagadPublicKey: '',
      nagadPrivateKey: '',
      isSandbox: true,
    };
  });

  const [isGatewaySettingsOpen, setIsGatewaySettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('trb_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleSaveGatewayKeys = (keys: PaymentGatewayKeys) => {
    setGatewayKeys(keys);
    localStorage.setItem('trb_gateway_keys', JSON.stringify(keys));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Cart Actions
  const handleAddToCart = (product: Product, size: string, color: string) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          selectedSize: size,
          selectedColor: color,
          quantity: 1,
        },
      ];
    });
    showToast(`Added ${product.name} to your Hunt!`);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Navigation handlers
  const navigateToPage = (page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    navigateToPage('product-detail');
  };

  const handleSelectCategory = (category: HuntCategory | 'all') => {
    setSelectedCategory(category);
    navigateToPage('shop');
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Montserrat',sans-serif] selection:bg-[#F25C05] selection:text-white flex flex-col">
      {/* Global Navigation Header */}
      <Header
        activePage={activePage}
        setActivePage={navigateToPage}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        onOpenGatewaysConfig={() => setIsGatewaySettingsOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activePage === 'home' && (
          <div className="flex flex-col">
            {/* 1920x1080 Autoplay Video Holder Section */}
            <VideoHeroSection
              onScrollToHero={() => {
                const hero = document.getElementById('hero-section');
                if (hero) hero.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Page 1: Hero Section */}
            <HeroSection
              onSeizeHunt={() => navigateToPage('shop')}
              setActivePage={navigateToPage}
            />

            {/* Page 2 & Page 7: Choose Your Hunt Category Selector */}
            <ChooseYourHunt onSelectCategory={handleSelectCategory} />

            {/* Page 3: New Arrivals Carousel */}
            <NewArrivals
              products={products}
              onSelectProduct={handleSelectProduct}
            />

            {/* Page 8: Catalog Grid Preview */}
            <ShopCatalog
              products={products}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectProduct={handleSelectProduct}
            />
          </div>
        )}

        {/* View: About / Brand Origin */}
        {activePage === 'about' && (
          <AboutView setActivePage={navigateToPage} />
        )}

        {/* View: Exchange Policy Guarantee & Form */}
        {activePage === 'exchange' && (
          <ExchangeView />
        )}

        {/* View: Shop Catalog */}
        {(activePage === 'shop' || activePage === 'try-on') && (
          <ShopCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {/* View: Product Detail (Page 9) */}
        {activePage === 'product-detail' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBack={() => navigateToPage('shop')}
            onProceedToCheckout={() => navigateToPage('checkout')}
          />
        )}

        {/* View: Checkout & Gateways (Page 10) */}
        {activePage === 'checkout' && (
          <CheckoutSection
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            gatewayKeys={gatewayKeys}
            onOpenGatewaySettings={() => setIsGatewaySettingsOpen(true)}
            onOrderCompleted={(order: OrderDetails) => {
              // Persist order to storeService so it dynamically shows up in Admin Panel
              storeService.addOrder(order);
              // Clean up cart
              setCartItems([]);
              showToast(`Order ${order.orderId} placed successfully! Tracking link sent to your phone.`);
            }}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          navigateToPage('checkout');
        }}
      />

      {/* Payment Gateway & Hosting Settings Modal */}
      <GatewaySettingsModal
        isOpen={isGatewaySettingsOpen}
        onClose={() => setIsGatewaySettingsOpen(false)}
        gatewayKeys={gatewayKeys}
        onSaveKeys={handleSaveGatewayKeys}
      />

      {/* Customer Gmail & Facebook Login Modal */}
      <CustomerAuthModal />

      {/* Floating AI Concierge Chatbot (Bottom-Right) */}
      <AIChatbot />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#F25C05] text-white px-5 py-3 text-xs tracking-[0.15em] uppercase font-light shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/20">
          {toastMessage}
        </div>
      )}

      {/* Footer */}
      <Footer
        setActivePage={navigateToPage}
        onOpenGatewaySettings={() => setIsGatewaySettingsOpen(true)}
      />
    </div>
  );
};

export default Storefront;
