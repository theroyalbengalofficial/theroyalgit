import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { storeService } from '../services/storeService';
import { Product, OrderDetails, OrderStatus, HuntCategory, CustomerUser } from '../types';
import BrandLogo from '../components/Logo';
import { ASSETS } from '../assets/images';
import { ApiIntegrationGuideModal } from '../components/ApiIntegrationGuideModal';
import { SocialLinksModal } from '../components/SocialLinksModal';
import { ServerStorageModal } from '../components/ServerStorageModal';
import { optimizeUploadedImage } from '../utils/imageOptimizer';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit3,
  ExternalLink,
  LogOut,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Check,
  Tag,
  Boxes,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Users,
  BookOpen,
  Copy,
  User,
  KeyRound,
  Share2,
  HardDrive,
  Upload,
} from 'lucide-react';

type AdminTab = 'overview' | 'orders' | 'products' | 'customers';

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

export const AdminDashboard: React.FC = () => {
  const { admin, logout, adminCredentials, updateCredentials } = useAdminAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Credentials Management Modal
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credAdminId, setCredAdminId] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [showCredPassword, setShowCredPassword] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [availableSizesList, setAvailableSizesList] = useState<string[]>([
    'S', 'M', 'L', 'XL', '2XL', '3XL',
  ]);

  // Core Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [customers, setCustomers] = useState<CustomerUser[]>([]);

  // Toast feedback & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showApiGuideModal, setShowApiGuideModal] = useState(false);
  const [isSocialLinksModalOpen, setIsSocialLinksModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Orders Tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderForView, setSelectedOrderForView] = useState<OrderDetails | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Customers Tab filters & View
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerProviderFilter, setCustomerProviderFilter] = useState<string>('all');
  const [customerZoneFilter, setCustomerZoneFilter] = useState<string>('all');
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<CustomerUser | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Products Tab filters & Modals
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Product Form State (for both Add & Edit)
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    styleCode: '',
    category: 'boardroom' as HuntCategory,
    price: 3500,
    stock: 25,
    description: '',
    fabric: '100% Egyptian Cotton',
    color: 'Midnight Navy',
    image: ASSETS.modelShirt,
    images: ['', '', ''] as string[],
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'] as string[],
    sizeStock: { S: 5, M: 8, L: 8, XL: 4, '2XL': 0, '3XL': 0 } as Record<string, number>,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedPhoneId(id);
      showToast(`Copied ${text} to clipboard`);
      setTimeout(() => setCopiedPhoneId(null), 2000);
    } catch (err) {
      console.warn('Clipboard access denied or unavailable:', err);
      showToast(`Copy: ${text}`);
    }
  };

  // Load and listen to real-time updates
  const loadData = () => {
    setProducts(storeService.getProducts());
    setOrders(storeService.getOrders());
    setCustomers(storeService.getCustomers());

    // Fetch live from server API so Incognito & all devices share the exact same catalog
    storeService.fetchProducts().then((p) => {
      if (p && Array.isArray(p)) setProducts(p);
    });
    storeService.fetchOrders().then((o) => {
      if (o && Array.isArray(o)) setOrders(o);
    });
  };

  useEffect(() => {
    loadData();

    const handleProductsUpdate = (e: any) => {
      if (e.detail) setProducts(e.detail);
      else setProducts(storeService.getProducts());
    };

    const handleOrdersUpdate = (e: any) => {
      if (e.detail) setOrders(e.detail);
      else setOrders(storeService.getOrders());
    };

    const handleCustomersUpdate = (e: any) => {
      if (e.detail) setCustomers(e.detail);
      else setCustomers(storeService.getCustomers());
    };

    window.addEventListener('trb_products_updated', handleProductsUpdate);
    window.addEventListener('trb_orders_updated', handleOrdersUpdate);
    window.addEventListener('trb_customers_updated', handleCustomersUpdate);
    window.addEventListener('storage', loadData);

    const handleServerFolderCreated = (e: any) => {
      if (e.detail?.folder) {
        showToast(`📁 Server Folder Created: ${e.detail.folderPath || 'storage/products/' + e.detail.folder}`);
      }
    };
    window.addEventListener('trb_server_folder_created', handleServerFolderCreated);

    // Periodic live sync every 4 seconds to pull any newly placed orders immediately
    const liveSyncInterval = setInterval(() => {
      storeService.fetchOrders().then((o) => {
        if (o && Array.isArray(o)) setOrders(o);
      });
      storeService.fetchCustomers().then((c) => {
        if (c && Array.isArray(c)) setCustomers(c);
      });
    }, 4000);

    return () => {
      clearInterval(liveSyncInterval);
      window.removeEventListener('trb_products_updated', handleProductsUpdate);
      window.removeEventListener('trb_orders_updated', handleOrdersUpdate);
      window.removeEventListener('trb_customers_updated', handleCustomersUpdate);
      window.removeEventListener('storage', loadData);
      window.removeEventListener('trb_server_folder_created', handleServerFolderCreated);
    };
  }, []);

  // Compute Metrics for Overview Tab
  const metrics = useMemo(() => {
    const totalSales = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
    const processingOrdersCount = orders.filter((o) => o.status === 'Processing').length;
    const completedOrdersCount = orders.filter((o) => o.status === 'Completed').length;
    const cancelledOrdersCount = orders.filter((o) => o.status === 'Cancelled').length;

    const totalProductsCount = products.length;
    const lowStockCount = products.filter((p) => (p.stock ?? 0) <= 10).length;
    const totalInventoryUnits = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

    const nonCancelledOrders = orders.filter((o) => o.status !== 'Cancelled');
    const averageOrderValue = nonCancelledOrders.length > 0 
      ? Math.round(totalSales / nonCancelledOrders.length) 
      : 0;

    return {
      totalSales,
      totalOrdersCount,
      pendingOrdersCount,
      processingOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      totalProductsCount,
      lowStockCount,
      totalInventoryUnits,
      averageOrderValue,
    };
  }, [orders, products]);

  // Orders filtered list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = 
        orderStatusFilter === 'all' || 
        order.status.toLowerCase() === orderStatusFilter.toLowerCase();

      const q = orderSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.orderId.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        order.address.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Products filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCat =
        productCategoryFilter === 'all' || product.category === productCategoryFilter;

      const q = productSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.styleCode.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.fabric.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Customers filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchProvider =
        customerProviderFilter === 'all' || cust.provider === customerProviderFilter;

      const matchZone =
        customerZoneFilter === 'all' || cust.deliveryZone === customerZoneFilter;

      const q = customerSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (cust.name && cust.name.toLowerCase().includes(q)) ||
        (cust.email && cust.email.toLowerCase().includes(q)) ||
        (cust.phone && cust.phone.toLowerCase().includes(q)) ||
        (cust.address && cust.address.toLowerCase().includes(q)) ||
        (cust.district && cust.district.toLowerCase().includes(q));

      return matchProvider && matchZone && matchSearch;
    });
  }, [customers, customerProviderFilter, customerZoneFilter, customerSearch]);

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = storeService.updateOrderStatus(orderId, newStatus);
    if (updated) {
      showToast(`Order ${orderId} marked as ${newStatus}`);
      if (selectedOrderForView?.orderId === orderId) {
        setSelectedOrderForView(updated);
      }
    }
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const ok = storeService.deleteOrder(orderToDelete);
    if (ok) {
      showToast(`Order ${orderToDelete} deleted`);
      if (selectedOrderForView?.orderId === orderToDelete) {
        setSelectedOrderForView(null);
      }
    }
    setOrderToDelete(null);
  };

  // Product Handlers
  const openAddProductModal = () => {
    const initialChosenSizes = ['M', 'L', 'XL'];
    const initialSizeStock: Record<string, number> = {
      M: 10,
      L: 10,
      XL: 5,
    };
    const initialTotalStock = initialChosenSizes.reduce<number>(
      (sum, q) => sum + (Number(initialSizeStock[q]) || 0),
      0
    );

    setFormData({
      name: '',
      subtitle: 'Executive Tailored Series',
      styleCode: `TRB-${Math.floor(100 + Math.random() * 900)}`,
      category: 'boardroom',
      price: 3800,
      stock: initialTotalStock,
      description: 'Crafted for distinguished command and tailored precision.',
      fabric: '100% Ultra-Fine Combed Cotton',
      color: 'Midnight Navy',
      image: ASSETS.shirtNavy || ASSETS.modelShirt,
      images: [ASSETS.shirtNavy || ASSETS.modelShirt, '', ''],
      sizes: initialChosenSizes,
      sizeStock: initialSizeStock,
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    const existingSizeStock = product.sizeStock || {};
    const chosenSizes = product.sizes && product.sizes.length > 0 
      ? product.sizes 
      : Object.keys(existingSizeStock).filter(k => (existingSizeStock[k] ?? 0) > 0);

    // Ensure all sizes from this product are in available list
    setAvailableSizesList((prev) => Array.from(new Set([...prev, ...chosenSizes])));

    const calculatedStock = Object.values(existingSizeStock).reduce<number>(
      (sum, qty) => sum + (Number(qty) || 0),
      0
    );

    const existingGallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : [product.image];
    const initialImages = [
      existingGallery[0] || product.image || '',
      existingGallery[1] || '',
      existingGallery[2] || '',
    ];

    setFormData({
      name: product.name,
      subtitle: product.subtitle || '',
      styleCode: product.styleCode,
      category: product.category,
      price: product.price,
      stock: calculatedStock || product.stock || 0,
      description: product.description,
      fabric: product.fabric,
      color: product.color,
      image: initialImages[0] || product.image,
      images: initialImages,
      sizes: chosenSizes.length > 0 ? chosenSizes : ['M', 'L', 'XL'],
      sizeStock: existingSizeStock,
    });
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      showToast('Please provide a valid product name and price.');
      return;
    }

    const sizeStock = formData.sizeStock || {};
    const chosenSizes = formData.sizes || [];
    // Only sizes chosen by user with stock > 0 will be visible on storefront
    const activeSizes = chosenSizes.filter((sz) => (Number(sizeStock[sz]) || 0) > 0);

    if (activeSizes.length === 0) {
      showToast('Please choose at least one size with inventory quantity greater than 0.');
      return;
    }

    const calculatedTotalStock = activeSizes.reduce<number>(
      (sum, sz) => sum + (Number(sizeStock[sz]) || 0),
      0
    );

    const validImages = (formData.images || [])
      .map((img) => (img || '').trim())
      .filter(Boolean);
    if (validImages.length === 0 && formData.image) {
      validImages.push(formData.image.trim());
    }
    const primaryImage = validImages[0] || formData.image || ASSETS.modelShirt;

    if (editingProduct) {
      // Update existing
      storeService.updateProductAsync(editingProduct.id, {
        name: formData.name.trim(),
        subtitle: formData.subtitle.trim(),
        styleCode: formData.styleCode.trim(),
        category: formData.category,
        price: Number(formData.price),
        stock: calculatedTotalStock,
        sizeStock: sizeStock,
        description: formData.description.trim(),
        fabric: formData.fabric.trim(),
        color: formData.color.trim(),
        image: primaryImage,
        gallery: validImages,
        sizes: activeSizes,
      }).then((res) => {
        if (res.storage?.folder) {
          showToast(`📁 Updated "${formData.name}" with ${validImages.length} images: ${res.storage.folderPath}`);
        } else {
          showToast(`Product "${formData.name}" updated successfully.`);
        }
      });
    } else {
      // Create new
      storeService.addProductAsync({
        name: formData.name.trim(),
        subtitle: formData.subtitle.trim(),
        styleCode: formData.styleCode.trim(),
        category: formData.category,
        price: Number(formData.price),
        currency: 'Tk.',
        stock: calculatedTotalStock,
        sizeStock: sizeStock,
        description: formData.description.trim(),
        fabric: formData.fabric.trim(),
        color: formData.color.trim(),
        colorOptions: [{ name: formData.color.trim(), hex: '#F25C05' }],
        image: primaryImage,
        sizes: activeSizes,
        gallery: validImages,
        measurements: [
          { size: 'S', length: 27.5, chest: 38, sleeveLength: 8.0 },
          { size: 'M', length: 28.0, chest: 41, sleeveLength: 8.5 },
          { size: 'L', length: 29.5, chest: 42, sleeveLength: 9.0 },
          { size: 'XL', length: 30.0, chest: 44, sleeveLength: 9.5 },
          { size: '2XL', length: 31.0, chest: 46, sleeveLength: 10.0 },
          { size: '3XL', length: 32.0, chest: 48, sleeveLength: 10.5 },
        ],
      }).then((res) => {
        if (res.storage?.folder) {
          showToast(`📁 New product created with ${validImages.length} images: ${res.storage.folderPath}`);
        } else {
          showToast(`New product "${formData.name}" added to live catalog.`);
        }
      });
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const ok = storeService.deleteProduct(productToDelete.id);
    if (ok) {
      showToast(`Product "${productToDelete.name}" removed from inventory.`);
    }
    setProductToDelete(null);
  };

  const handleResetCatalog = () => {
    if (window.confirm('Reset all catalog items to the default Royal Bengal collection? Any custom added items will be restored.')) {
      storeService.resetProductsToDefault();
      showToast('Catalog restored to default Royal Bengal collection.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (s === 'processing' || s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium bg-sky-950/70 text-sky-400 border border-sky-500/40">
          <Clock className="w-3 h-3" /> Processing
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium bg-amber-950/70 text-amber-400 border border-amber-500/40">
          <AlertTriangle className="w-3 h-3" /> Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium bg-rose-950/70 text-rose-400 border border-rose-500/40">
        <XCircle className="w-3 h-3" /> Cancelled
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Montserrat',sans-serif] flex flex-col selection:bg-[#F25C05] selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" title="Return to Storefront">
              <BrandLogo size="sm" />
            </Link>
            <div className="hidden sm:block border-l border-white/15 pl-4">
              <div className="text-xs uppercase tracking-[0.25em] font-medium text-white flex items-center gap-2">
                Executive Command Center
                <span className="bg-[#F25C05] text-white text-[9px] px-1.5 py-0.2 tracking-wider font-bold">
                  ADMIN
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 tracking-wider">
                {admin?.email || 'admin@royalbengal.com'}
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowApiGuideModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-xs text-white bg-[#F25C05] hover:bg-[#ff6811] border border-[#F25C05] shadow-[0_0_15px_rgba(242,92,5,0.3)] transition-all tracking-wider uppercase cursor-pointer font-medium"
              title="Open step-by-step API Setup Guide for Google OAuth, Facebook Login and F-Commerce"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="inline">API Setup Guide</span>
              <span className="hidden md:inline text-[9px] bg-black/40 text-amber-200 px-1.5 py-0.2 font-mono">
                NOOB STEP-BY-STEP
              </span>
            </button>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all tracking-wider uppercase"
              title="Open customer storefront in a new tab"
            >
              <span>Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#F25C05]" />
            </Link>

            <button
              onClick={() => setIsStorageModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all tracking-wider uppercase cursor-pointer font-medium"
              title="View Created Product Folders & Connect Purchased Server Storage"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Server Storage</span>
            </button>

            <button
              onClick={() => setIsSocialLinksModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all tracking-wider uppercase cursor-pointer"
              title="Manage Social Media Links (Facebook, Instagram, WhatsApp, etc.)"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F25C05]" />
              <span className="hidden md:inline">Social Links</span>
            </button>

            <button
              onClick={() => {
                setCredAdminId(adminCredentials.adminId);
                setCredPassword(adminCredentials.password);
                setIsCredentialsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-300 hover:text-white bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 transition-all tracking-wider uppercase cursor-pointer"
              title="View or Change Admin ID & Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F25C05]" />
              <span className="hidden md:inline">Admin Credentials</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition-all tracking-wider uppercase cursor-pointer"
              title="Sign out of admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4 mb-8">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all cursor-pointer border ${
                activeTab === 'overview'
                  ? 'bg-[#F25C05] text-white border-[#F25C05] shadow-[0_0_15px_rgba(242,92,5,0.4)]'
                  : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-[#F25C05]/50 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all cursor-pointer border ${
                activeTab === 'orders'
                  ? 'bg-[#F25C05] text-white border-[#F25C05] shadow-[0_0_15px_rgba(242,92,5,0.4)]'
                  : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-[#F25C05]/50 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Management</span>
              {metrics.pendingOrdersCount > 0 && (
                <span className="ml-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {metrics.pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all cursor-pointer border ${
                activeTab === 'products'
                  ? 'bg-[#F25C05] text-white border-[#F25C05] shadow-[0_0_15px_rgba(242,92,5,0.4)]'
                  : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-[#F25C05]/50 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory & Products</span>
              <span className="ml-1 text-neutral-400 text-[11px]">
                ({products.length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.2em] uppercase font-medium transition-all cursor-pointer border ${
                activeTab === 'customers'
                  ? 'bg-[#F25C05] text-white border-[#F25C05] shadow-[0_0_15px_rgba(242,92,5,0.4)]'
                  : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-[#F25C05]/50 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Accounts</span>
              <span className="ml-1 text-neutral-400 text-[11px]">
                ({customers.length})
              </span>
            </button>
          </div>

          {/* Tab Specific Quick Action */}
          <div>
            {activeTab === 'products' && (
              <button
                onClick={openAddProductModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs font-medium tracking-[0.15em] uppercase transition-all shadow-[0_0_15px_rgba(242,92,5,0.35)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            )}
            {activeTab === 'orders' && (
              <div className="text-xs text-neutral-400 uppercase tracking-wider">
                Total Orders: <span className="text-white font-medium">{orders.length}</span>
              </div>
            )}
            {activeTab === 'customers' && (
              <div className="text-xs text-neutral-400 uppercase tracking-wider">
                Total Registered: <span className="text-white font-medium">{customers.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Total Sales */}
              <div className="bg-neutral-950 border border-white/15 p-5 relative overflow-hidden group hover:border-[#F25C05]/60 transition-colors">
                <div className="flex items-center justify-between text-neutral-400 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                    Total Revenue
                  </span>
                  <div className="p-2 bg-[#F25C05]/15 text-[#F25C05] border border-[#F25C05]/30">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                  Tk. {metrics.totalSales.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real-time orders</span>
                </div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-neutral-950 border border-white/15 p-5 relative overflow-hidden group hover:border-[#F25C05]/60 transition-colors">
                <div className="flex items-center justify-between text-neutral-400 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                    Total Orders
                  </span>
                  <div className="p-2 bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                  {metrics.totalOrdersCount}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-2">
                  <span className="text-amber-400 font-medium">{metrics.pendingOrdersCount} Pending</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{metrics.completedOrdersCount} Done</span>
                </div>
              </div>

              {/* Card 3: Registered Customers */}
              <div
                onClick={() => setActiveTab('customers')}
                className="bg-neutral-950 border border-white/15 p-5 relative overflow-hidden group hover:border-[#F25C05] transition-all cursor-pointer"
                title="Click to manage customer accounts"
              >
                <div className="flex items-center justify-between text-neutral-400 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium group-hover:text-[#F25C05] transition-colors">
                    Customer Users
                  </span>
                  <div className="p-2 bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:border-[#F25C05] group-hover:text-[#F25C05]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                  {customers.length}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-2">
                  <span className="text-emerald-400 font-medium">
                    {customers.filter((c) => c.provider === 'google').length} Gmail
                  </span>
                  <span>•</span>
                  <span className="text-blue-400 font-medium">
                    {customers.filter((c) => c.provider === 'facebook').length} FB
                  </span>
                </div>
              </div>

              {/* Card 4: Total Products in Catalog */}
              <div className="bg-neutral-950 border border-white/15 p-5 relative overflow-hidden group hover:border-[#F25C05]/60 transition-colors">
                <div className="flex items-center justify-between text-neutral-400 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                    Catalog Items
                  </span>
                  <div className="p-2 bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                  {metrics.totalProductsCount}
                </div>
                <div className="text-[11px] text-neutral-400 mt-2">
                  <span>{metrics.totalInventoryUnits} Units in Stock</span>
                </div>
              </div>

              {/* Card 5: Average Order Value */}
              <div className="bg-neutral-950 border border-white/15 p-5 relative overflow-hidden group hover:border-[#F25C05]/60 transition-colors">
                <div className="flex items-center justify-between text-neutral-400 mb-3">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                    Avg. Order Value
                  </span>
                  <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                  Tk. {metrics.averageOrderValue.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-400 mt-2">
                  <span>Per transaction</span>
                </div>
              </div>
            </div>

            {/* Revenue Analytics & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Visual Revenue Breakdown */}
              <div className="lg:col-span-2 bg-neutral-950 border border-white/15 p-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-white">
                      Order Fulfillment Status Distribution
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                      Visual operational progress of all recorded purchases
                    </p>
                  </div>
                  <button
                    onClick={loadData}
                    className="flex items-center gap-1 text-[11px] uppercase text-[#F25C05] hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {/* Status distribution bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-300 font-light">Completed Orders</span>
                      <span className="text-emerald-400 font-mono">
                        {metrics.completedOrdersCount} orders (
                        {metrics.totalOrdersCount > 0
                          ? Math.round((metrics.completedOrdersCount / metrics.totalOrdersCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            metrics.totalOrdersCount > 0
                              ? (metrics.completedOrdersCount / metrics.totalOrdersCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-300 font-light">Processing / Packaging</span>
                      <span className="text-sky-400 font-mono">
                        {metrics.processingOrdersCount} orders (
                        {metrics.totalOrdersCount > 0
                          ? Math.round((metrics.processingOrdersCount / metrics.totalOrdersCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-sky-500 transition-all duration-500"
                        style={{
                          width: `${
                            metrics.totalOrdersCount > 0
                              ? (metrics.processingOrdersCount / metrics.totalOrdersCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-300 font-light">Pending Review</span>
                      <span className="text-amber-400 font-mono">
                        {metrics.pendingOrdersCount} orders (
                        {metrics.totalOrdersCount > 0
                          ? Math.round((metrics.pendingOrdersCount / metrics.totalOrdersCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{
                          width: `${
                            metrics.totalOrdersCount > 0
                              ? (metrics.pendingOrdersCount / metrics.totalOrdersCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-300 font-light">Cancelled / Returned</span>
                      <span className="text-rose-400 font-mono">
                        {metrics.cancelledOrdersCount} orders (
                        {metrics.totalOrdersCount > 0
                          ? Math.round((metrics.cancelledOrdersCount / metrics.totalOrdersCount) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-black/60 rounded-sm overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${
                            metrics.totalOrdersCount > 0
                              ? (metrics.cancelledOrdersCount / metrics.totalOrdersCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[10px] uppercase text-neutral-400 tracking-wider">
                      bKash Gateway
                    </div>
                    <div className="text-base font-light text-white mt-1">
                      {orders.filter((o) => o.paymentMethod === 'bkash').length} orders
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5">
                    <div className="text-[10px] uppercase text-neutral-400 tracking-wider">
                      Nagad Gateway
                    </div>
                    <div className="text-base font-light text-white mt-1">
                      {orders.filter((o) => o.paymentMethod === 'nagad').length} orders
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                    <div className="text-[10px] uppercase text-neutral-400 tracking-wider">
                      Dhaka 2-Hr Express
                    </div>
                    <div className="text-base font-light text-white mt-1">
                      {orders.filter((o) => o.deliveryMethod === '2hour-dhaka').length} orders
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Category Stock Summary & Quick Action */}
              <div className="bg-neutral-950 border border-white/15 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-white pb-3 border-b border-white/10 mb-4">
                    Category Inventory
                  </h3>
                  <div className="space-y-3.5">
                    {(['signature', 'boardroom', 'daily', '24x7', 'holiday'] as HuntCategory[]).map((cat) => {
                      const catProducts = products.filter((p) => p.category === cat || (cat === 'holiday' && p.category === 'weekend'));
                      const catStock = catProducts.reduce((sum, p) => sum + (p.stock ?? 0), 0);
                      const catLabel =
                        cat === 'signature' ? 'Signature Hunt' :
                        cat === 'boardroom' ? 'Boardroom Hunt' :
                        cat === 'daily' ? 'Daily Hunt' :
                        cat === '24x7' ? '24x7 Hunt' : 'Holiday Hunt';

                      return (
                        <div key={cat} className="p-3 bg-black/50 border border-white/10 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-white tracking-wider uppercase">
                              {catLabel}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {catProducts.length} styles active
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-light text-[#F25C05] font-mono">
                              {catStock}
                            </span>
                            <span className="text-[10px] text-neutral-500 block">units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
                  <button
                    onClick={openAddProductModal}
                    className="w-full py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs tracking-[0.15em] uppercase font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-neutral-300 hover:text-white text-xs tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> View All Orders
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-neutral-950 border border-white/15 p-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-white">
                    Recent Customer Transactions
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                    Latest incoming purchases from the customer checkout
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#F25C05] hover:underline uppercase tracking-wider flex items-center gap-1"
                >
                  Manage All Orders <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 text-[10px] uppercase tracking-[0.15em]">
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Gateway</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.orderId} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-medium text-white">
                          {order.orderId}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-white">{order.customerName}</div>
                          <div className="text-[10px] text-neutral-400">{order.phone}</div>
                        </td>
                        <td className="py-3.5 px-3 uppercase text-neutral-300 text-[11px]">
                          {order.paymentMethod}
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#F25C05]">
                          Tk. {order.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3">{getStatusBadge(order.status)}</td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrderForView(order)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                            title="View Full Order Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ORDER MANAGEMENT ==================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter Bar with Live Sync indicator */}
            <div className="bg-neutral-950 border border-white/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Customer, Phone..."
                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#F25C05] transition-colors"
                />
              </div>

              {/* Status pills + Refresh button */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  {['all', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-colors cursor-pointer shrink-0 ${
                        orderStatusFilter === status
                          ? 'bg-[#F25C05] text-white border-[#F25C05]'
                          : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {status === 'all' ? 'All Orders' : status}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    storeService.fetchOrders().then((o) => {
                      if (o && Array.isArray(o)) {
                        setOrders(o);
                        showToast(`Orders refreshed: ${o.length} total orders`);
                      }
                    });
                  }}
                  className="px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Force re-sync orders from server"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sync Orders ({orders.length})</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-neutral-950 border border-white/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-neutral-400 text-[10px] uppercase tracking-[0.15em]">
                      <th className="py-3.5 px-4">Order Details</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Delivery & Method</th>
                      <th className="py-3.5 px-4">Items</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Status & Switch</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-neutral-500 text-xs tracking-wider">
                          No customer orders match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-white/5 transition-colors">
                          {/* Order ID & Date */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-mono font-medium text-white text-sm">
                              {order.orderId}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#F25C05]" />
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Customer info */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <span>{order.customerName}</span>
                              {order.authProvider && (
                                <span className="text-[9px] uppercase px-1 py-0.2 font-mono bg-[#F25C05]/15 text-[#F25C05] border border-[#F25C05]/30">
                                  {order.authProvider === 'google' ? 'Gmail' : order.authProvider === 'facebook' ? 'FB' : order.authProvider}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-300 flex items-center gap-1 mt-1 font-mono">
                              <Phone className="w-3 h-3 text-[#F25C05]" />
                              <span>{order.phone}</span>
                              <button
                                onClick={() => copyToClipboard(order.phone, `phone-${order.orderId}`)}
                                className="text-neutral-500 hover:text-white p-0.5 cursor-pointer ml-0.5"
                                title="Copy phone"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            {order.email && (
                              <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-neutral-500" />
                                <span className="truncate max-w-[170px]">{order.email}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-neutral-400 mt-1 flex items-start gap-1" title={`${order.address}, ${order.district}`}>
                              <MapPin className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
                              <span className="truncate max-w-[190px]">{order.address}, {order.district}</span>
                            </div>
                          </td>

                          {/* Delivery & Payment */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                              <CreditCard className="w-3.5 h-3.5 text-[#F25C05]" />
                              <span className="uppercase font-medium">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border ${
                                  order.deliveryMethod === 'inside-dhaka'
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                    : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40'
                                }`}
                              >
                                <Truck className="w-3 h-3" />
                                {order.deliveryMethod === 'inside-dhaka'
                                  ? 'Inside Dhaka (৳100)'
                                  : order.deliveryMethod === 'outside-dhaka'
                                  ? 'Outside Dhaka (৳150)'
                                  : order.deliveryMethod === '2hour-dhaka'
                                  ? 'Dhaka Express (৳100)'
                                  : 'Outside Dhaka (৳150)'}
                              </span>
                            </div>
                          </td>

                          {/* Items Purchased */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-[11px] text-neutral-300 flex items-center gap-2">
                                  <span className="font-medium text-white">{item.quantity}×</span>
                                  <span className="truncate max-w-[140px]">{item.product.name}</span>
                                  <span className="text-[10px] text-neutral-400">({item.selectedSize})</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-sm text-[#F25C05]">
                              Tk. {order.total.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              Sub: Tk. {order.subtotal}
                            </div>
                          </td>

                          {/* Status & Quick Change Dropdown */}
                          <td className="py-4 px-4 align-top">
                            <div className="mb-2">{getStatusBadge(order.status)}</div>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.orderId, e.target.value as OrderStatus)
                              }
                              className="bg-black/80 border border-white/20 text-[11px] text-neutral-300 px-2 py-1 rounded-none focus:outline-none focus:border-[#F25C05] cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 align-top text-right space-x-2">
                            <button
                              onClick={() => setSelectedOrderForView(order)}
                              className="p-1.5 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-colors cursor-pointer"
                              title="View Full Order Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setOrderToDelete(order.orderId)}
                              className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: INVENTORY & PRODUCT MANAGEMENT ==================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Cloud Server Storage & Persistence Banner */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="font-medium text-emerald-300">Central Server Storage Active</span>
                  <span className="text-neutral-400 font-extralight ml-2">
                    ({products.length} {products.length === 1 ? 'product' : 'products'} live across Incognito & all visitors)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSyncing(true);
                    const ok = await storeService.syncProductsToServer();
                    setSyncing(false);
                    if (ok) {
                      setToastMessage('Catalog successfully synced to Central Server!');
                      setTimeout(() => setToastMessage(null), 3000);
                    }
                  }}
                  className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Push local products to the central server"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync to Server'}</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-neutral-950 border border-white/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by name, style code, fabric..."
                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#F25C05] transition-colors"
                />
              </div>

              {/* Category selector + Reset action */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'signature', 'boardroom', 'daily', '24x7', 'holiday'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setProductCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-colors cursor-pointer ${
                        productCategoryFilter === cat
                          ? 'bg-[#F25C05] text-white border-[#F25C05]'
                          : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat === '24x7' ? '24x7' : cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleResetCatalog}
                  title="Reset to default Royal Bengal products"
                  className="p-2 text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/30 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Products Grid / Table */}
            <div className="bg-neutral-950 border border-white/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-neutral-400 text-[10px] uppercase tracking-[0.15em]">
                      <th className="py-3.5 px-4">Item & Code</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4">Sizes & Fabric</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-neutral-500 text-xs tracking-wider">
                          No products found. Click &quot;Add New Product&quot; to expand your inventory.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const stockCount = product.stock ?? 0;
                        const isLowStock = stockCount <= 10;
                        const isOutOfStock = stockCount <= 0;

                        return (
                          <tr key={product.id} className="hover:bg-white/5 transition-colors">
                            {/* Product preview & info */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 bg-black border border-white/10 shrink-0 overflow-hidden relative">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-white text-sm">
                                    {product.name}
                                  </div>
                                  <div className="text-[10px] text-[#F25C05] font-mono">
                                    {product.styleCode}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                                    {product.subtitle}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-4 px-4 align-top">
                              <span className="px-2 py-0.5 text-[10px] tracking-wider uppercase font-medium bg-white/5 border border-white/10 text-neutral-300">
                                {product.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-medium text-white text-sm">
                                Tk. {product.price.toLocaleString()}
                              </div>
                            </td>

                            {/* Stock */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-mono font-medium ${
                                    isOutOfStock
                                      ? 'text-rose-400'
                                      : isLowStock
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {stockCount}
                                </span>
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.5 border ${
                                    isOutOfStock
                                      ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                                      : isLowStock
                                      ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                                      : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                                  }`}
                                >
                                  {isOutOfStock ? 'Out' : isLowStock ? 'Low' : 'Healthy'}
                                </span>
                              </div>
                            </td>

                            {/* Sizes & Fabric */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex flex-wrap gap-1 max-w-[170px]">
                                {product.sizes?.map((sz) => {
                                  const qty = product.sizeStock?.[sz];
                                  return (
                                    <span
                                      key={sz}
                                      className="px-1.5 py-0.2 bg-black border border-white/15 text-[9px] text-neutral-300 font-mono"
                                      title={qty !== undefined ? `Size ${sz}: ${qty} units in stock` : undefined}
                                    >
                                      {sz}{qty !== undefined ? `: ${qty}` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="text-[10px] text-neutral-400 mt-1 truncate max-w-[160px]">
                                {product.fabric}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 align-top text-right space-x-2">
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-1.5 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-colors cursor-pointer"
                                title="Edit Product Details & Stock"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(product)}
                                className="p-1.5 text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CUSTOMER ACCOUNTS ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-950 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  Total Customers
                </div>
                <div className="text-xl font-light text-white mt-1">
                  {customers.length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Logged in via Gmail / Facebook
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Gmail Accounts
                </div>
                <div className="text-xl font-light text-white mt-1">
                  {customers.filter((c) => c.provider === 'google').length}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">
                  Google OAuth
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Facebook Accounts
                </div>
                <div className="text-xl font-light text-white mt-1">
                  {customers.filter((c) => c.provider === 'facebook').length}
                </div>
                <div className="text-[10px] text-blue-400/80 mt-0.5">
                  Meta OAuth
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-[#F25C05]" />
                  Delivery Locations
                </div>
                <div className="text-sm font-light text-white mt-1">
                  <span className="text-amber-400">{customers.filter((c) => c.deliveryZone === 'inside-dhaka').length} Inside</span>
                  <span className="text-neutral-500 mx-1.5">/</span>
                  <span className="text-indigo-400">{customers.filter((c) => c.deliveryZone === 'outside-dhaka').length} Outside</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Saved delivery zones
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-neutral-950 border border-white/15 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer name, phone, address, district, email..."
                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-[#F25C05] transition-colors"
                />
              </div>

              {/* Provider & Zone Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Provider pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase text-neutral-400 tracking-wider mr-1 hidden sm:inline">
                    Provider:
                  </span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'google', label: 'Gmail' },
                    { id: 'facebook', label: 'Facebook' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCustomerProviderFilter(p.id)}
                      className={`px-2.5 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-colors cursor-pointer ${
                        customerProviderFilter === p.id
                          ? 'bg-[#F25C05] text-white border-[#F25C05]'
                          : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Zone pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase text-neutral-400 tracking-wider mr-1 hidden sm:inline">
                    Zone:
                  </span>
                  {[
                    { id: 'all', label: 'All Zones' },
                    { id: 'inside-dhaka', label: 'Inside Dhaka' },
                    { id: 'outside-dhaka', label: 'Outside Dhaka' },
                  ].map((z) => (
                    <button
                      key={z.id}
                      onClick={() => setCustomerZoneFilter(z.id)}
                      className={`px-2.5 py-1.5 text-[10px] tracking-wider uppercase font-medium border transition-colors cursor-pointer ${
                        customerZoneFilter === z.id
                          ? 'bg-[#F25C05] text-white border-[#F25C05]'
                          : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* API Integration Callout Banner */}
            <div className="p-3.5 bg-neutral-900/90 border border-[#F25C05]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F25C05]/20 border border-[#F25C05] flex items-center justify-center text-[#F25C05] flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-white font-medium flex items-center gap-2">
                    <span>Customer Authentication Channels: Google OAuth 2.0 &amp; Meta Facebook Login</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 font-mono">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light">
                    Need step-by-step guidance for Google Client ID, Meta App ID, or Meta Commerce Manager Catalog Feed?
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowApiGuideModal(true)}
                className="px-3.5 py-1.5 bg-[#F25C05] hover:bg-[#ff6811] text-white text-[11px] uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open API Setup Guide</span>
              </button>
            </div>

            {/* Customers Table */}
            <div className="bg-neutral-950 border border-white/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-neutral-400 text-[10px] uppercase tracking-[0.15em]">
                      <th className="py-3.5 px-4">Customer Profile</th>
                      <th className="py-3.5 px-4">Login Provider</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4">Delivery Address & Zone</th>
                      <th className="py-3.5 px-4">Orders & Spend</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-neutral-500 text-xs tracking-wider">
                          No customer users match your search or filter. Customers will automatically appear here when they log in via Gmail/Facebook and place orders.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => {
                        const customerOrders = orders.filter(
                          (o) =>
                            o.customerId === customer.id ||
                            (customer.email && o.email?.toLowerCase() === customer.email.toLowerCase()) ||
                            (customer.phone && o.phone === customer.phone)
                        );
                        const totalSpent = customerOrders
                          .filter((o) => o.status !== 'Cancelled')
                          .reduce((sum, o) => sum + (o.total || 0), 0);

                        return (
                          <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                            {/* Profile */}
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-3">
                                {customer.avatar ? (
                                  <img
                                    src={customer.avatar}
                                    alt={customer.name}
                                    className="w-10 h-10 rounded-full border border-white/20 object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-medium shrink-0">
                                    {customer.name?.charAt(0) || 'U'}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-white text-sm">
                                    {customer.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                                    ID: {customer.id.substring(0, 12)}...
                                  </div>
                                  <div className="text-[10px] text-neutral-500 mt-0.5">
                                    Joined: {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Login Provider */}
                            <td className="py-4 px-4 align-top">
                              {customer.provider === 'google' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/40">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                  </svg>
                                  Gmail
                                </span>
                              ) : customer.provider === 'facebook' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-500/40">
                                  <svg className="w-3.5 h-3.5 fill-[#1877F2]" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                  </svg>
                                  Facebook
                                </span>
                              ) : (
                                <span className="text-[11px] uppercase text-neutral-400 bg-white/5 px-2 py-0.5 border border-white/10">
                                  Direct
                                </span>
                              )}
                            </td>

                            {/* Contact Details */}
                            <td className="py-4 px-4 align-top">
                              {customer.phone ? (
                                <div className="flex items-center gap-1.5 text-white font-mono">
                                  <Phone className="w-3.5 h-3.5 text-[#F25C05]" />
                                  <a
                                    href={`tel:${customer.phone}`}
                                    className="hover:underline hover:text-[#F25C05]"
                                    title="Click to call customer"
                                  >
                                    {customer.phone}
                                  </a>
                                  <button
                                    onClick={() => copyToClipboard(customer.phone!, `cust-phone-${customer.id}`)}
                                    className="p-1 text-neutral-500 hover:text-white cursor-pointer"
                                    title="Copy phone"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-neutral-500 italic text-[11px]">No phone added yet</span>
                              )}

                              {customer.email && (
                                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-1.5">
                                  <Mail className="w-3 h-3 text-neutral-500" />
                                  <a
                                    href={`mailto:${customer.email}`}
                                    className="hover:underline hover:text-white truncate max-w-[190px]"
                                  >
                                    {customer.email}
                                  </a>
                                </div>
                              )}
                            </td>

                            {/* Shipping Address & Zone */}
                            <td className="py-4 px-4 align-top">
                              {customer.address ? (
                                <div className="space-y-1">
                                  <div className="text-white flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2 max-w-[220px]" title={customer.address}>
                                      {customer.address}
                                    </span>
                                  </div>
                                  <div className="text-neutral-400 text-[10px] pl-4">
                                    District: <strong className="text-neutral-200">{customer.district || 'Dhaka'}</strong>
                                  </div>
                                  <div className="pl-4">
                                    <span
                                      className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold border ${
                                        customer.deliveryZone === 'inside-dhaka'
                                          ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                                          : 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300'
                                      }`}
                                    >
                                      {customer.deliveryZone === 'inside-dhaka' ? 'Inside Dhaka (৳100)' : 'Outside Dhaka (৳150)'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-neutral-500 italic text-[11px]">
                                  Pending first checkout address
                                </div>
                              )}
                            </td>

                            {/* Orders & Spend */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-mono text-sm font-medium text-white">
                                {customerOrders.length} {customerOrders.length === 1 ? 'order' : 'orders'}
                              </div>
                              <div className="text-[11px] text-[#F25C05] font-mono mt-0.5">
                                Tk. {totalSpent.toLocaleString()} spent
                              </div>
                              {customerOrders.length > 0 && (
                                <div className="text-[10px] text-neutral-400 mt-1">
                                  Latest: {new Date(customerOrders[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 align-top text-right">
                              <button
                                onClick={() => setSelectedCustomerForView(customer)}
                                className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                                title="View customer profile and order history"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Profile</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: ADD / EDIT PRODUCT ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-950 border-2 border-[#F25C05] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#F25C05]" />
                <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-white">
                  {editingProduct ? 'Edit Product Specifications' : 'Add New Product to Inventory'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. The Bengal Sovereign"
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Subtitle / Cut Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Bespoke Formal Double-Ply Shirt"
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Price (Tk) */}
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Price (Tk. BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as HuntCategory })
                    }
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#F25C05] cursor-pointer"
                  >
                    <option value="signature">Signature Hunt</option>
                    <option value="boardroom">Boardroom Hunt</option>
                    <option value="daily">Daily Hunt</option>
                    <option value="24x7">24x7 Hunt</option>
                    <option value="holiday">Holiday Hunt</option>
                  </select>
                </div>

                {/* Style Code */}
                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Style Code / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.styleCode}
                    onChange={(e) => setFormData({ ...formData, styleCode: e.target.value })}
                    placeholder="TRB-015"
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                {/* Interactive Size Selection & Quantity Allocation */}
                <div className="sm:col-span-2 bg-neutral-900/95 border border-white/15 p-4 space-y-4 shadow-inner">
                  {/* Header & Total Units */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#F25C05]" />
                        <span>Choose Available Sizes & Set Quantity *</span>
                        <span className="text-[9px] bg-[#F25C05]/20 text-[#F25C05] px-1.5 py-0.5 border border-[#F25C05]/40 font-mono">
                          Storefront Live Sync
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                        Select which sizes are offered. Only chosen sizes with quantity &gt; 0 will appear and be purchasable on the website.
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[11px] text-neutral-400">Total Units In Stock: </span>
                      <span className="text-sm font-semibold font-mono text-[#F25C05]">
                        {(formData.sizes || []).reduce<number>(
                          (s, sz) => s + (Number(formData.sizeStock?.[sz]) || 0),
                          0
                        )}{' '}
                        pcs
                      </span>
                    </div>
                  </div>

                  {/* STEP 1: CHOOSE WHICH SIZES TO OFFER */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-medium">
                        Step 1: Choose Available Sizes
                      </label>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const allSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
                            const newStock = { ...(formData.sizeStock || {}) };
                            allSizes.forEach((s) => {
                              if ((newStock[s] ?? 0) === 0) newStock[s] = 10;
                            });
                            const total = allSizes.reduce<number>(
                              (sum, s) => sum + (Number(newStock[s]) || 0),
                              0
                            );
                            setFormData({
                              ...formData,
                              sizes: allSizes,
                              sizeStock: newStock,
                              stock: total,
                            });
                          }}
                          className="text-[#F25C05] hover:underline cursor-pointer"
                        >
                          Select All Standard
                        </button>
                        <span className="text-neutral-600">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const standardOnly = ['S', 'M', 'L', 'XL'];
                            const newStock = { ...(formData.sizeStock || {}) };
                            standardOnly.forEach((s) => {
                              if ((newStock[s] ?? 0) === 0) newStock[s] = 10;
                            });
                            const total = standardOnly.reduce<number>(
                              (sum, s) => sum + (Number(newStock[s]) || 0),
                              0
                            );
                            setFormData({
                              ...formData,
                              sizes: standardOnly,
                              sizeStock: newStock,
                              stock: total,
                            });
                          }}
                          className="text-neutral-300 hover:text-white cursor-pointer"
                        >
                          Select S - XL
                        </button>
                        <span className="text-neutral-600">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              sizes: [],
                              stock: 0,
                            });
                          }}
                          className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Size Selectable Buttons */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {availableSizesList.map((sz) => {
                        const isChosen = (formData.sizes || []).includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              const currentSizes = formData.sizes || [];
                              let updatedSizes: string[];
                              const updatedStock = { ...(formData.sizeStock || {}) };

                              if (isChosen) {
                                updatedSizes = currentSizes.filter((s) => s !== sz);
                              } else {
                                updatedSizes = [...currentSizes, sz];
                                if ((updatedStock[sz] ?? 0) === 0) {
                                  updatedStock[sz] = 10;
                                }
                              }

                              const totalStock = updatedSizes.reduce<number>(
                                (sum, s) => sum + (Number(updatedStock[s]) || 0),
                                0
                              );

                              setFormData({
                                ...formData,
                                sizes: updatedSizes,
                                sizeStock: updatedStock,
                                stock: totalStock,
                              });
                            }}
                            className={`px-3 py-1.5 text-xs font-mono font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isChosen
                                ? 'bg-[#F25C05] text-white border-[#F25C05] shadow-[0_0_12px_rgba(242,92,5,0.4)]'
                                : 'bg-black/60 text-neutral-400 border-white/20 hover:border-white/50 hover:text-white'
                            }`}
                          >
                            {isChosen ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span className="w-3 h-3 border border-white/30 inline-block rounded-xs" />
                            )}
                            <span>Size {sz}</span>
                          </button>
                        );
                      })}

                      {/* Add Custom Size Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          placeholder="Custom (e.g. 42)"
                          className="w-28 px-2 py-1.5 bg-black/70 border border-white/20 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = customSizeInput.trim().toUpperCase();
                              if (val && !availableSizesList.includes(val)) {
                                setAvailableSizesList([...availableSizesList, val]);
                                const newSizes = [...(formData.sizes || []), val];
                                const newStock = { ...(formData.sizeStock || {}), [val]: 10 };
                                const total = newSizes.reduce<number>(
                                  (sum, s) => sum + (Number(newStock[s]) || 0),
                                  0
                                );
                                setFormData({
                                  ...formData,
                                  sizes: newSizes,
                                  sizeStock: newStock,
                                  stock: total,
                                });
                                setCustomSizeInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = customSizeInput.trim().toUpperCase();
                            if (val && !availableSizesList.includes(val)) {
                              setAvailableSizesList([...availableSizesList, val]);
                              const newSizes = [...(formData.sizes || []), val];
                              const newStock = { ...(formData.sizeStock || {}), [val]: 10 };
                              const total = newSizes.reduce<number>(
                                (sum, s) => sum + (Number(newStock[s]) || 0),
                                0
                              );
                              setFormData({
                                ...formData,
                                sizes: newSizes,
                                sizeStock: newStock,
                                stock: total,
                              });
                              setCustomSizeInput('');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: QUANTITY SPECIFICATION FOR CHOSEN SIZES */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-medium">
                        Step 2: Inventory Stock for Chosen Sizes
                      </label>
                      <span className="text-[10px] text-neutral-400">
                        {(formData.sizes || []).length} size(s) chosen
                      </span>
                    </div>

                    {(formData.sizes || []).length === 0 ? (
                      <div className="p-4 bg-black/40 border border-dashed border-amber-500/40 text-amber-300 text-xs text-center">
                        No sizes chosen yet. Click any size button above to select it for this product.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {(formData.sizes || []).map((sz) => {
                          const qty = formData.sizeStock?.[sz] ?? 0;
                          const isAvailable = qty > 0;
                          return (
                            <div
                              key={sz}
                              className={`p-2.5 border transition-all ${
                                isAvailable
                                  ? 'bg-black border-[#F25C05]/60 shadow-[0_0_10px_rgba(242,92,5,0.15)]'
                                  : 'bg-black/40 border-amber-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold font-mono text-white">Size {sz}</span>
                                <span
                                  className={`text-[9px] uppercase px-1 py-0.2 font-mono ${
                                    isAvailable
                                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {isAvailable ? 'In Stock' : 'Zero'}
                                </span>
                              </div>

                              {/* Stepper + Input */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = formData.sizeStock?.[sz] ?? 0;
                                    const nextVal = Math.max(0, current - 1);
                                    const newStock = { ...(formData.sizeStock || {}), [sz]: nextVal };
                                    const total = (formData.sizes || []).reduce<number>(
                                      (sum, s) => sum + (Number(newStock[s]) || 0),
                                      0
                                    );
                                    setFormData({
                                      ...formData,
                                      sizeStock: newStock,
                                      stock: total,
                                    });
                                  }}
                                  className="w-6 h-7 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center font-mono text-xs cursor-pointer shrink-0"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={qty}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    const newStock = { ...(formData.sizeStock || {}), [sz]: val };
                                    const total = (formData.sizes || []).reduce<number>(
                                      (sum, s) => sum + (Number(newStock[s]) || 0),
                                      0
                                    );
                                    setFormData({
                                      ...formData,
                                      sizeStock: newStock,
                                      stock: total,
                                    });
                                  }}
                                  className="w-full px-1.5 py-1 bg-neutral-950 border border-white/20 text-white font-mono text-xs text-center focus:outline-none focus:border-[#F25C05]"
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = formData.sizeStock?.[sz] ?? 0;
                                    const nextVal = current + 1;
                                    const newStock = { ...(formData.sizeStock || {}), [sz]: nextVal };
                                    const total = (formData.sizes || []).reduce<number>(
                                      (sum, s) => sum + (Number(newStock[s]) || 0),
                                      0
                                    );
                                    setFormData({
                                      ...formData,
                                      sizeStock: newStock,
                                      stock: total,
                                    });
                                  }}
                                  className="w-6 h-7 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center font-mono text-xs cursor-pointer shrink-0"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Live Feedback Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 text-[11px] text-neutral-400 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>
                        Visible on Website:{' '}
                        <strong className="text-white font-mono">
                          {(formData.sizes || [])
                            .filter((sz) => (Number(formData.sizeStock?.[sz]) || 0) > 0)
                            .map((sz) => `${sz} (${formData.sizeStock?.[sz]} pcs)`)
                            .join(', ') || 'None selected (product will show Out of Stock)'}
                        </strong>
                      </span>
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Only chosen sizes with quantity &gt; 0 will appear on the customer storefront
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                  Description / Story *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Artisan tailored details..."
                  className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white placeholder-neutral-500 focus:outline-none focus:border-[#F25C05]"
                />
              </div>

              {/* Fabric & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Fabric Composition
                  </label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    placeholder="100% Giza Egyptian Cotton"
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#F25C05]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                    Primary Color Name
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Midnight Navy"
                    className="w-full px-3 py-2 bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#F25C05]"
                  />
                </div>
              </div>

              {/* 2-3 Product Images Upload Section (Primary Cover, Fabric Detail, Angle/Silhouette) */}
              <div className="space-y-3 p-4 bg-black/50 border border-white/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="block text-white uppercase tracking-wider text-xs font-semibold">
                      Product Perspectives & Fabric Images (2-3 Angles)
                    </label>
                    <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                      Upload 2 to 3 photos to display in the product page gallery and enable fabric inspection.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                    <HardDrive className="w-3 h-3" />
                    WebP Auto-Optimized
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {[
                    { index: 0, label: 'Image 1: Primary Cover', sub: 'Front Silhouette (Required)' },
                    { index: 1, label: 'Image 2: Fabric Detail', sub: 'Weave Close-up (Recommended)' },
                    { index: 2, label: 'Image 3: Collar / Angle', sub: 'Profile / Fit (Optional)' },
                  ].map(({ index, label, sub }) => {
                    const currentVal = (formData.images && formData.images[index]) || (index === 0 ? formData.image : '');
                    return (
                      <div key={index} className="flex flex-col border border-white/15 p-3 bg-black/70 relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-white tracking-wide">{label}</span>
                          {currentVal && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formData.images || ['', '', ''])];
                                updated[index] = '';
                                setFormData({
                                  ...formData,
                                  images: updated,
                                  ...(index === 0 ? { image: updated[1] || updated[2] || '' } : {}),
                                });
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 mb-2 font-light">{sub}</span>

                        {/* Image Preview Box */}
                        <div className="relative aspect-[3/4] w-full border border-white/20 bg-neutral-950 overflow-hidden flex items-center justify-center mb-2.5">
                          {currentVal ? (
                            <img
                              src={currentVal}
                              alt={label}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-neutral-500 p-2 text-center">
                              <Upload className="w-5 h-5 text-neutral-600" />
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Slot {index + 1} Empty</span>
                            </div>
                          )}
                        </div>

                        {/* URL input */}
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...(formData.images || ['', '', ''])];
                            updated[index] = val;
                            setFormData({
                              ...formData,
                              images: updated,
                              ...(index === 0 ? { image: val } : {}),
                            });
                          }}
                          placeholder="/assets/... or image URL"
                          className="w-full px-2.5 py-1.5 bg-black/90 border border-white/20 text-white text-[11px] mb-2 focus:outline-none focus:border-[#F25C05]"
                        />

                        {/* Upload from device button */}
                        <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-[#F25C05] text-white text-[10px] uppercase tracking-wider cursor-pointer transition-all border border-white/20 hover:border-[#F25C05]">
                          <Upload className="w-3 h-3 text-[#F25C05] group-hover:text-white" />
                          <span>Upload From Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 20 * 1024 * 1024) {
                                  showToast('Photo is too large (max 20MB).');
                                  return;
                                }
                                try {
                                  showToast(`Optimizing image ${index + 1}...`);
                                  const result = await optimizeUploadedImage(file, {
                                    maxWidth: 1600,
                                    maxHeight: 1600,
                                    quality: 0.82,
                                    format: 'image/webp',
                                  });
                                  const updated = [...(formData.images || ['', '', ''])];
                                  updated[index] = result.dataUrl;
                                  setFormData({
                                    ...formData,
                                    images: updated,
                                    ...(index === 0 ? { image: result.dataUrl } : {}),
                                  });
                                  const savedKb = Math.round((result.originalSize - result.optimizedSize) / 1024);
                                  showToast(`Image ${index + 1} optimized: ${Math.round(result.optimizedSize / 1024)} KB (${savedKb} KB saved)`);
                                } catch (err) {
                                  console.error('Image optimization fallback:', err);
                                  const reader = new FileReader();
                                  reader.onload = (loadEvent) => {
                                    const res = loadEvent.target?.result as string;
                                    if (res) {
                                      const updated = [...(formData.images || ['', '', ''])];
                                      updated[index] = res;
                                      setFormData({
                                        ...formData,
                                        images: updated,
                                        ...(index === 0 ? { image: res } : {}),
                                      });
                                      showToast(`Image ${index + 1} loaded.`);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Presets Row */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-neutral-400 pt-1">
                  <span>Quick Presets for Image 1:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(formData.images || ['', '', ''])];
                      updated[0] = ASSETS.modelShirt;
                      setFormData({ ...formData, image: ASSETS.modelShirt, images: updated });
                    }}
                    className="text-[#F25C05] hover:underline cursor-pointer"
                  >
                    Biscuit Shirt
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(formData.images || ['', '', ''])];
                      updated[0] = ASSETS.shirtNavy;
                      setFormData({ ...formData, image: ASSETS.shirtNavy, images: updated });
                    }}
                    className="text-[#F25C05] hover:underline cursor-pointer"
                  >
                    Navy Shirt
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(formData.images || ['', '', ''])];
                      updated[0] = ASSETS.shirtWhite;
                      setFormData({ ...formData, image: ASSETS.shirtWhite, images: updated });
                    }}
                    className="text-[#F25C05] hover:underline cursor-pointer"
                  >
                    White Shirt
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#F25C05] hover:bg-[#ff6811] text-white tracking-[0.2em] uppercase font-medium transition-all shadow-[0_0_15px_rgba(242,92,5,0.4)] cursor-pointer"
                >
                  {editingProduct ? 'Save Modifications' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FULL ORDER INVOICE / VIEW ==================== */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-950 border-2 border-[#F25C05] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#F25C05]" />
                <div>
                  <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-white">
                    Order Invoice: {selectedOrderForView.orderId}
                  </h3>
                  <div className="text-[10px] text-neutral-400">
                    Placed on {new Date(selectedOrderForView.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForView(null)}
                className="text-neutral-400 hover:text-white text-xs uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-6 text-xs font-light">
              {/* Status Header */}
              <div className="p-4 bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-neutral-400 uppercase text-[10px] block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrderForView.status)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 uppercase text-[10px]">Update:</span>
                  {(['Pending', 'Processing', 'Completed', 'Cancelled'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateOrderStatus(selectedOrderForView.orderId, st)}
                      className={`px-2.5 py-1 text-[10px] uppercase font-medium border cursor-pointer ${
                        selectedOrderForView.status === st
                          ? 'bg-[#F25C05] text-white border-[#F25C05]'
                          : 'bg-black/50 text-neutral-300 border-white/20 hover:border-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Shipping & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 p-4 border border-white/10">
                <div>
                  <div className="text-[#F25C05] uppercase tracking-wider text-[10px] font-medium mb-1.5">
                    Customer Information
                  </div>
                  <div className="font-medium text-white text-sm">{selectedOrderForView.customerName}</div>
                  <div className="text-neutral-300 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" /> {selectedOrderForView.phone}
                  </div>
                  {selectedOrderForView.email && (
                    <div className="text-neutral-300 mt-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-500" /> {selectedOrderForView.email}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[#F25C05] uppercase tracking-wider text-[10px] font-medium mb-1.5">
                    Delivery Address
                  </div>
                  <div className="text-white flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <span>
                      {selectedOrderForView.address}, {selectedOrderForView.district}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px] mt-2">
                    Method: {selectedOrderForView.deliveryMethod === '2hour-dhaka' ? '⚡ 2-Hour Dhaka Express' : 'Standard Shipping'}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    Payment: <strong className="text-white uppercase">{selectedOrderForView.paymentMethod}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized list */}
              <div>
                <div className="text-neutral-400 uppercase tracking-wider text-[10px] font-medium mb-2">
                  Items Ordered
                </div>
                <div className="border border-white/10 divide-y divide-white/5">
                  {selectedOrderForView.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-black/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-black border border-white/10 overflow-hidden shrink-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-white">{item.product.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            Size: {item.selectedSize} • Color: {item.selectedColor} • Qty: {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-medium text-white">
                        Tk. {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation breakdown */}
              <div className="p-4 bg-black/60 border border-white/10 space-y-1.5 text-right font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>Tk. {selectedOrderForView.subtotal.toLocaleString()}</span>
                </div>
                {selectedOrderForView.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-Tk. {selectedOrderForView.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>Delivery Charge:</span>
                  <span>Tk. {selectedOrderForView.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#F25C05] pt-2 border-t border-white/10">
                  <span className="font-sans uppercase text-xs tracking-wider">Grand Total:</span>
                  <span>Tk. {selectedOrderForView.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setOrderToDelete(selectedOrderForView.orderId);
                  }}
                  className="text-rose-400 hover:text-rose-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Order
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForView(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white uppercase tracking-wider text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONFIRM DELETE ORDER ==================== */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-rose-500/60 p-6 shadow-2xl text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <h4 className="text-sm font-medium uppercase tracking-wider text-white mb-2">
              Confirm Order Deletion
            </h4>
            <p className="text-xs text-neutral-400 font-light mb-6">
              Are you sure you want to permanently delete order <strong className="text-white">{orderToDelete}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-neutral-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteOrder}
                className="px-5 py-2 text-xs uppercase tracking-wider font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONFIRM DELETE PRODUCT ==================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-950 border border-rose-500/60 p-6 shadow-2xl text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <h4 className="text-sm font-medium uppercase tracking-wider text-white mb-2">
              Remove Product from Catalog?
            </h4>
            <p className="text-xs text-neutral-400 font-light mb-6">
              Remove <strong className="text-white">&quot;{productToDelete.name}&quot;</strong> from active inventory? Customers will no longer be able to purchase this item.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-neutral-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                className="px-5 py-2 text-xs uppercase tracking-wider font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-lg cursor-pointer"
              >
                Remove Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CUSTOMER PROFILE & ORDER HISTORY ==================== */}
      {selectedCustomerForView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-950 border border-white/20 p-6 sm:p-8 shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3.5">
                {selectedCustomerForView.avatar ? (
                  <img
                    src={selectedCustomerForView.avatar}
                    alt={selectedCustomerForView.name}
                    className="w-14 h-14 rounded-full border-2 border-[#F25C05] object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-[#F25C05] flex items-center justify-center text-white text-lg font-medium">
                    {selectedCustomerForView.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium uppercase tracking-wider text-white">
                      {selectedCustomerForView.name}
                    </h3>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 font-mono font-medium border ${
                        selectedCustomerForView.provider === 'google'
                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                          : selectedCustomerForView.provider === 'facebook'
                          ? 'bg-blue-950/50 text-blue-300 border-blue-500/40'
                          : 'bg-white/10 text-neutral-300 border-white/20'
                      }`}
                    >
                      {selectedCustomerForView.provider === 'google'
                        ? 'Google / Gmail'
                        : selectedCustomerForView.provider === 'facebook'
                        ? 'Facebook OAuth'
                        : 'Direct Account'}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">
                    Customer ID: {selectedCustomerForView.id}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Registered On:{' '}
                    {new Date(selectedCustomerForView.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerForView(null)}
                className="text-neutral-400 hover:text-white text-xs uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 border border-white/10 p-4 mb-6 text-xs">
              {/* Phone & Email */}
              <div className="space-y-2">
                <div className="text-[10px] text-[#F25C05] uppercase tracking-wider font-semibold">
                  Contact Information
                </div>
                <div className="text-white flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#F25C05]" />
                  <span>{selectedCustomerForView.phone || 'No phone registered yet'}</span>
                  {selectedCustomerForView.phone && (
                    <button
                      onClick={() => copyToClipboard(selectedCustomerForView.phone!, 'modal-phone')}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                      title="Copy phone"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-neutral-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{selectedCustomerForView.email || 'No email registered'}</span>
                </div>
              </div>

              {/* Delivery Zone & Address */}
              <div className="space-y-2">
                <div className="text-[10px] text-[#F25C05] uppercase tracking-wider font-semibold">
                  Delivery Destination
                </div>
                <div className="text-white flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>
                    {selectedCustomerForView.address
                      ? `${selectedCustomerForView.address}, ${selectedCustomerForView.district || 'Dhaka'}`
                      : 'No delivery address saved yet'}
                  </span>
                </div>
                {selectedCustomerForView.deliveryZone && (
                  <div className="pt-1">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border ${
                        selectedCustomerForView.deliveryZone === 'inside-dhaka'
                          ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                          : 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300'
                      }`}
                    >
                      {selectedCustomerForView.deliveryZone === 'inside-dhaka'
                        ? 'Inside Dhaka (৳100 Shipping)'
                        : 'Outside Dhaka (৳150 Shipping)'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Orders Placed by this Customer */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                <h4 className="text-xs uppercase tracking-[0.15em] font-medium text-white">
                  Order History & Purchases
                </h4>
                <span className="text-[11px] text-neutral-400">
                  {
                    orders.filter(
                      (o) =>
                        o.customerId === selectedCustomerForView.id ||
                        (selectedCustomerForView.email && o.email?.toLowerCase() === selectedCustomerForView.email.toLowerCase()) ||
                        (selectedCustomerForView.phone && o.phone === selectedCustomerForView.phone)
                    ).length
                  }{' '}
                  Total Orders
                </span>
              </div>

              {(() => {
                const userOrders = orders.filter(
                  (o) =>
                    o.customerId === selectedCustomerForView.id ||
                    (selectedCustomerForView.email && o.email?.toLowerCase() === selectedCustomerForView.email.toLowerCase()) ||
                    (selectedCustomerForView.phone && o.phone === selectedCustomerForView.phone)
                );

                if (userOrders.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-neutral-500 border border-white/5 bg-black/20">
                      No purchase orders registered for this user yet.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="p-3 bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-white">{ord.orderId}</span>
                            {getStatusBadge(ord.status)}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            • {ord.items.length} item(s) •{' '}
                            <span className="capitalize">{ord.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="font-mono font-medium text-[#F25C05] text-sm">
                            Tk. {ord.total.toLocaleString()}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCustomerForView(null);
                              setSelectedOrderForView(ord);
                            }}
                            className="px-2.5 py-1 text-[11px] uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                          >
                            View Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerForView(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white uppercase tracking-wider text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADMIN CREDENTIALS CONFIGURATION ==================== */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/20 w-full max-w-md p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F25C05]" />
                <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-white">
                  Admin ID &amp; Password Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs uppercase cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-light leading-relaxed mb-5">
              Specify the authorized Admin ID and Password required to enter the Admin Command Center.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!credAdminId.trim() || !credPassword.trim()) {
                  showToast('Both Admin ID and Password are required.');
                  return;
                }
                const ok = updateCredentials(credAdminId, credPassword);
                if (ok) {
                  showToast('Admin ID and Password updated successfully!');
                  setIsCredentialsModalOpen(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                  Admin ID *
                </label>
                <input
                  type="text"
                  required
                  value={credAdminId}
                  onChange={(e) => setCredAdminId(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Current ID: <strong className="text-white font-mono">{adminCredentials.adminId}</strong>
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1.5">
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showCredPassword ? 'text' : 'password'}
                    required
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3 pr-10 py-2.5 bg-black/60 border border-white/20 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-[#F25C05]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredPassword(!showCredPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                    tabIndex={-1}
                    title={showCredPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-300 uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F25C05] hover:bg-[#ff6811] text-white uppercase tracking-wider font-medium text-xs shadow-[0_0_15px_rgba(242,92,5,0.4)] cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: API INTEGRATION GUIDE ==================== */}
      <ApiIntegrationGuideModal
        isOpen={showApiGuideModal}
        onClose={() => setShowApiGuideModal(false)}
      />

      {/* ==================== MODAL: SOCIAL MEDIA LINKS ==================== */}
      <SocialLinksModal
        isOpen={isSocialLinksModalOpen}
        onClose={() => setIsSocialLinksModalOpen(false)}
      />

      {/* ==================== MODAL: SERVER STORAGE & PRODUCT FOLDERS ==================== */}
      <ServerStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        onRefreshProducts={loadData}
      />

      {/* Real-time Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#F25C05] text-white px-5 py-3 text-xs tracking-[0.15em] uppercase font-light shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/20 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
