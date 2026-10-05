import { Product, OrderDetails, OrderStatus, CustomerUser } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';

const PRODUCTS_STORAGE_KEY = 'trb_products_v1';
const ORDERS_STORAGE_KEY = 'trb_orders_v1';
const CUSTOMERS_STORAGE_KEY = 'trb_customers_v1';

// No dummy/sample customers: only real customers who register or place orders
const INITIAL_CUSTOMERS: CustomerUser[] = [];

// Known dummy customer IDs & emails to scrub from client cache
const DUMMY_CUSTOMER_IDENTIFIERS = new Set([
  'cust_google_tanvir',
  'cust_fb_farhan',
  'cust_google_zubair',
  'tanvir.ahmed@apexholdings.bd',
  'farhan.c@chittagongshipping.com',
  'z.rahman@venturepartners.bd',
  'mahmudul.hasan@gmail.com',
  'nafis.fcommerce@facebook.com',
]);

// Known dummy product IDs that should be permanently stripped
const DUMMY_PRODUCT_IDS = new Set(['test-101', 'trb-009-dummy', 'trb-dummy']);

// Known dummy order IDs to permanently purge
const DUMMY_ORDER_IDS = new Set([
  'TRB-849201',
  'TRB-849182',
  'TRB-848995',
  'TRB-848410',
]);

// No dummy orders: only real customer orders placed via checkout
const INITIAL_ORDERS: OrderDetails[] = [];

export const storeService = {
  // Products Management
  getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Permanently strip out test dummy products
          const uploadedOnly = parsed.filter(
            (p) =>
              p &&
              p.id &&
              !DUMMY_PRODUCT_IDS.has(p.id) &&
              !p.id.startsWith('dummy-')
          );
          // If dummy products were scrubbed, persist clean array
          if (uploadedOnly.length !== parsed.length) {
            this.saveProducts(uploadedOnly);
          }

          if (uploadedOnly.length === 0 && Array.isArray(INITIAL_PRODUCTS) && INITIAL_PRODUCTS.length > 0) {
            this.saveProducts(INITIAL_PRODUCTS);
            return INITIAL_PRODUCTS;
          }

          const DEFAULT_MEASUREMENTS = [
            { size: 'S', length: 27.5, chest: 38, sleeveLength: 8.0 },
            { size: 'M', length: 28.0, chest: 41, sleeveLength: 8.5 },
            { size: 'L', length: 29.5, chest: 42, sleeveLength: 9.0 },
            { size: 'XL', length: 30.0, chest: 44, sleeveLength: 9.5 },
            { size: '2XL', length: 31.0, chest: 46, sleeveLength: 10.0 },
            { size: '3XL', length: 32.0, chest: 48, sleeveLength: 10.5 },
          ];

          const normalized = uploadedOnly.map((p) => ({
            ...p,
            colorOptions:
              Array.isArray(p.colorOptions) && p.colorOptions.length > 0
                ? p.colorOptions
                : [{ name: p.color || 'Signature Orange', hex: '#F25C05' }],
            sizes:
              Array.isArray(p.sizes) && p.sizes.length > 0
                ? p.sizes
                : ['S', 'M', 'L', 'XL', '2XL'],
            gallery:
              Array.isArray(p.gallery) && p.gallery.length > 0
                ? p.gallery
                : [p.image || ''],
            measurements:
              Array.isArray(p.measurements) && p.measurements.length > 0
                ? p.measurements
                : DEFAULT_MEASUREMENTS,
          }));
          return normalized;
        }
      }
    } catch (err) {
      console.error('Error loading products from storage:', err);
    }

    if (Array.isArray(INITIAL_PRODUCTS) && INITIAL_PRODUCTS.length > 0) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }

    return [];
  },

  // Asynchronous server-sync methods (ensures incognito & all devices see all products)
  async fetchProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          if (data.products.length > 0) {
            const filteredRemote = data.products.filter(
              (p: any) => p && p.id && !DUMMY_PRODUCT_IDS.has(p.id) && !p.id.startsWith('dummy-')
            );
            if (filteredRemote.length > 0) {
              const DEFAULT_MEASUREMENTS = [
                { size: 'S', length: 27.5, chest: 38, sleeveLength: 8.0 },
                { size: 'M', length: 28.0, chest: 41, sleeveLength: 8.5 },
                { size: 'L', length: 29.5, chest: 42, sleeveLength: 9.0 },
                { size: 'XL', length: 30.0, chest: 44, sleeveLength: 9.5 },
                { size: '2XL', length: 31.0, chest: 46, sleeveLength: 10.0 },
                { size: '3XL', length: 32.0, chest: 48, sleeveLength: 10.5 },
              ];
              const normalized = filteredRemote.map((p: any) => ({
                ...p,
                colorOptions:
                  Array.isArray(p.colorOptions) && p.colorOptions.length > 0
                    ? p.colorOptions
                    : [{ name: p.color || 'Signature Orange', hex: '#F25C05' }],
                sizes:
                  Array.isArray(p.sizes) && p.sizes.length > 0
                    ? p.sizes
                    : ['S', 'M', 'L', 'XL', '2XL'],
                gallery:
                  Array.isArray(p.gallery) && p.gallery.length > 0
                    ? p.gallery
                    : [p.image || ''],
                measurements:
                  Array.isArray(p.measurements) && p.measurements.length > 0
                    ? p.measurements
                    : DEFAULT_MEASUREMENTS,
              }));
              // Server has live products: update local cache and notify UI
              this.saveProducts(normalized);
              return normalized;
            }
          } else {
            // Server has 0 products: check if client has products in localStorage to migrate!
            const local = this.getProducts();
            if (local.length > 0) {
              console.log('[storeService] Migrating local products to server...');
              await this.syncProductsToServer(local);
              return local;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[storeService] Server offline or fetch failed, using local cache:', err);
    }
    return this.getProducts();
  },

  async syncProductsToServer(products?: Product[]): Promise<boolean> {
    const toSync = products || this.getProducts();
    try {
      const res = await fetch('/api/products/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: toSync, overwrite: true }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.success;
      }
    } catch (err) {
      console.error('[storeService] Failed to sync products to server:', err);
    }
    return false;
  },

  saveProducts(products: Product[]) {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('trb_products_updated', { detail: products }));
    } catch (err) {
      console.error('Error saving products:', err);
    }
  },

  addProduct(newProductData: Omit<Product, 'id'> & { id?: string }): Product {
    const products = this.getProducts();
    const id = newProductData.id || `trb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Determine available sizes and total stock from sizeStock if provided
    let calculatedSizes = newProductData.sizes;
    let calculatedStock = newProductData.stock ?? 25;

    if (newProductData.sizeStock && Object.keys(newProductData.sizeStock).length > 0) {
      const activeSizes = Object.entries(newProductData.sizeStock)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([sz]) => sz);
      calculatedSizes = activeSizes;
      calculatedStock = Object.values(newProductData.sizeStock).reduce(
        (sum, qty) => sum + (Number(qty) || 0),
        0
      );
    }

    const product: Product = {
      ...newProductData,
      id,
      styleCode: newProductData.styleCode || `TRB-${Math.floor(100 + Math.random() * 900)}`,
      currency: newProductData.currency || 'Tk.',
      stock: calculatedStock,
      sizeStock: newProductData.sizeStock,
      sizes: calculatedSizes && calculatedSizes.length > 0 
        ? calculatedSizes 
        : ['S', 'M', 'L', 'XL', '2XL'],
      colorOptions: newProductData.colorOptions && newProductData.colorOptions.length > 0
        ? newProductData.colorOptions
        : [{ name: newProductData.color || 'Signature Orange', hex: '#F25C05' }],
      measurements: newProductData.measurements && newProductData.measurements.length > 0
        ? newProductData.measurements
        : [
            { size: 'S', length: 27.5, chest: 38, sleeveLength: 8.0 },
            { size: 'M', length: 28.0, chest: 41, sleeveLength: 8.5 },
            { size: 'L', length: 29.5, chest: 42, sleeveLength: 9.0 },
            { size: 'XL', length: 30.0, chest: 44, sleeveLength: 9.5 },
            { size: '2XL', length: 31.0, chest: 46, sleeveLength: 10.0 },
            { size: '3XL', length: 32.0, chest: 48, sleeveLength: 10.5 },
          ],
      gallery: newProductData.gallery && newProductData.gallery.length > 0
        ? newProductData.gallery
        : [newProductData.image],
    };

    const updated = [product, ...products];
    this.saveProducts(updated);

    // Save to server API and create physical product folder
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.storage?.folder) {
            window.dispatchEvent(
              new CustomEvent('trb_server_folder_created', { detail: data.storage })
            );
          }
        }
      })
      .catch((err) => console.warn('[storeService] Failed to post product to server:', err));

    return product;
  },

  async addProductAsync(
    newProductData: Omit<Product, 'id'> & { id?: string }
  ): Promise<{ product: Product; storage?: any }> {
    const product = this.addProduct(newProductData);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const data = await res.json();
        return { product: data.product || product, storage: data.storage };
      }
    } catch (err) {
      console.warn('[storeService] addProductAsync server error:', err);
    }
    return { product };
  },

  async updateProductAsync(
    id: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; storage?: any }> {
    const product = this.updateProduct(id, updates);
    if (!product) return { product: null };
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const data = await res.json();
        return { product: data.product || product, storage: data.storage };
      }
    } catch (err) {
      console.warn('[storeService] updateProductAsync server error:', err);
    }
    return { product };
  },

  // --------------------------------------------------------------------------
  // PURCHASED SERVER STORAGE METHODS
  // --------------------------------------------------------------------------
  async getStorageInfo() {
    try {
      const res = await fetch('/api/storage/info');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[storeService] getStorageInfo error:', e);
    }
    return null;
  },

  async getStorageFolders() {
    try {
      const res = await fetch('/api/storage/folders');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[storeService] getStorageFolders error:', e);
    }
    return { success: false, folders: [] };
  },

  async getStorageConfig() {
    try {
      const res = await fetch('/api/storage/config');
      if (res.ok) {
        const data = await res.json();
        return data.config;
      }
    } catch (e) {
      console.warn('[storeService] getStorageConfig error:', e);
    }
    return null;
  },

  async saveStorageConfig(config: any) {
    try {
      const res = await fetch('/api/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[storeService] saveStorageConfig error:', e);
    }
    return { success: false };
  },

  async testServerConnection(params?: {
    serverUrl?: string;
    authToken?: string;
    serverType?: string;
  }) {
    try {
      const res = await fetch('/api/storage/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection failed' };
    }
  },

  async syncAllFoldersToServer() {
    try {
      const res = await fetch('/api/storage/sync-all', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
    return { success: false };
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    let updatedSizes = updates.sizes;
    let updatedStock = updates.stock;

    if (updates.sizeStock) {
      const activeSizes = Object.entries(updates.sizeStock)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([sz]) => sz);
      updatedSizes = activeSizes;
      updatedStock = Object.values(updates.sizeStock).reduce(
        (sum, qty) => sum + (Number(qty) || 0),
        0
      );
    }

    const updatedProduct: Product = {
      ...products[index],
      ...updates,
      ...(updatedSizes ? { sizes: updatedSizes } : {}),
      ...(updatedStock !== undefined ? { stock: updatedStock } : {}),
    };
    products[index] = updatedProduct;
    this.saveProducts(products);

    // Update on server API in background
    fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct),
    }).catch((err) => console.warn('[storeService] Failed to put product to server:', err));

    return updatedProduct;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length !== products.length) {
      this.saveProducts(filtered);

      // Delete on server API in background
      fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('[storeService] Failed to delete product on server:', err));

      return true;
    }
    return false;
  },

  resetProductsToDefault(): Product[] {
    this.saveProducts([]);
    fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: [], overwrite: true }),
    }).catch((err) => console.warn('[storeService] Failed to clear products on server:', err));
    return [];
  },

  // Orders Management
  getOrders(): OrderDetails[] {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed: OrderDetails[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Permanently strip out test/dummy orders
          const realOrders = parsed.filter((o) => o && o.orderId && !DUMMY_ORDER_IDS.has(o.orderId));
          if (realOrders.length !== parsed.length) {
            this.saveOrders(realOrders);
          }
          return realOrders;
        }
      }
    } catch (err) {
      console.error('Error loading orders from storage:', err);
    }

    return [];
  },

  async fetchOrders(): Promise<OrderDetails[]> {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const remoteOrders: OrderDetails[] = data.orders.filter(
            (o: any) => o && (o.orderId || o.orderNumber) && !DUMMY_ORDER_IDS.has(o.orderId || o.orderNumber)
          ).map((o: any) => ({
            ...o,
            orderId: o.orderId || o.orderNumber,
            orderNumber: o.orderNumber || o.orderId,
          }));

          const localOrders = this.getOrders();

          // Merge by orderId so that neither local orders nor server orders are wiped out
          const orderMap = new Map<string, OrderDetails>();
          localOrders.forEach((o) => {
            const key = o.orderId || o.orderNumber;
            if (key) orderMap.set(key, o);
          });

          remoteOrders.forEach((o) => {
            const key = o.orderId || o.orderNumber;
            if (key) {
              const existing = orderMap.get(key);
              // Server status/data takes precedence, keeping any local fields
              orderMap.set(key, { ...(existing || {}), ...o });
            }
          });

          const mergedOrders = Array.from(orderMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          this.saveOrders(mergedOrders);

          // Upload any local orders that weren't on server yet
          localOrders.forEach((lo) => {
            const key = lo.orderId || lo.orderNumber;
            if (key && !remoteOrders.some((ro) => ro.orderId === key || ro.orderNumber === key)) {
              fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lo),
              }).catch((e) => console.warn('[storeService] Auto-sync local order to server error:', e));
            }
          });

          return mergedOrders;
        }
      }
    } catch (err) {
      console.warn('[storeService] Failed to fetch orders from server:', err);
    }
    return this.getOrders();
  },

  saveOrders(orders: OrderDetails[]) {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('trb_orders_updated', { detail: orders }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error saving orders:', err);
    }
  },

  addOrder(order: OrderDetails): OrderDetails {
    const orders = this.getOrders();
    const orderNum = order.orderId || order.orderNumber || `TRB-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Normalize status to capitalized format if lowercase
    const normalizedStatus: OrderStatus = 
      (order.status || 'Pending').toLowerCase() === 'processing' ? 'Processing' :
      (order.status || 'Pending').toLowerCase() === 'confirmed' ? 'Processing' :
      (order.status || 'Pending').toLowerCase() === 'completed' ? 'Completed' :
      (order.status || 'Pending').toLowerCase() === 'cancelled' ? 'Cancelled' : 'Pending';

    const normalizedOrder: OrderDetails = {
      ...order,
      orderId: orderNum,
      orderNumber: orderNum,
      status: normalizedStatus,
      createdAt: order.createdAt || new Date().toISOString(),
    };

    const existingIndex = orders.findIndex(
      (o) => o.orderId === normalizedOrder.orderId || o.orderNumber === normalizedOrder.orderNumber
    );

    let updated: OrderDetails[];
    if (existingIndex >= 0) {
      orders[existingIndex] = normalizedOrder;
      updated = [...orders];
    } else {
      updated = [normalizedOrder, ...orders];
    }

    this.saveOrders(updated);

    // Persist immediately to hosting server disk and remote storage
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedOrder),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          console.log('[storeService] Order persisted to server disk:', normalizedOrder.orderId);
        }
      })
      .catch(async (err) => {
        console.warn('[storeService] Failed to persist order to /api/orders, checking direct server webhook:', err);
        try {
          const cfg = await this.getStorageConfig();
          if (cfg && cfg.enabled && cfg.serverUrl) {
            const target = cfg.serverUrl.includes('?')
              ? `${cfg.serverUrl}&action=save_order`
              : `${cfg.serverUrl}?action=save_order`;
            fetch(target, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}`, 'X-API-Key': cfg.authToken } : {}),
              },
              body: JSON.stringify({ action: 'save_order', order: normalizedOrder }),
            }).catch(() => {});
          }
        } catch (e) {}
      });

    // Upsert customer info automatically so it shows in Admin Panel
    try {
      this.upsertCustomer({
        id: normalizedOrder.customerId,
        name: normalizedOrder.customerName,
        email: normalizedOrder.email || `customer-${normalizedOrder.orderId.toLowerCase()}@royalbengal.bd`,
        phone: normalizedOrder.phone,
        address: normalizedOrder.address,
        district: normalizedOrder.district,
        deliveryZone: normalizedOrder.deliveryMethod === 'inside-dhaka' ? 'inside-dhaka' : 'outside-dhaka',
        provider: normalizedOrder.authProvider || 'guest',
        totalOrdersIncrement: 1,
        totalSpentIncrement: normalizedOrder.total,
      });
    } catch (e) {
      console.error('Failed to sync customer on order creation:', e);
    }

    // Also decrement product stock where possible
    try {
      const products = this.getProducts();
      let productsChanged = false;
      normalizedOrder.items.forEach((item) => {
        const target = products.find((p) => p.id === item.product.id);
        if (target) {
          if (typeof target.stock === 'number') {
            target.stock = Math.max(0, target.stock - item.quantity);
            productsChanged = true;
          }
          if (target.sizeStock && item.selectedSize && target.sizeStock[item.selectedSize] !== undefined) {
            target.sizeStock[item.selectedSize] = Math.max(0, target.sizeStock[item.selectedSize] - item.quantity);
            // Update available sizes to only those with quantity > 0
            target.sizes = Object.entries(target.sizeStock)
              .filter(([_, qty]) => Number(qty) > 0)
              .map(([sz]) => sz);
            productsChanged = true;
          }
        }
      });
      if (productsChanged) {
        this.saveProducts(products);
      }
    } catch (e) {
      console.error('Failed to deduct product stock:', e);
    }

    return normalizedOrder;
  },

  async addOrderAsync(order: OrderDetails): Promise<OrderDetails> {
    const saved = this.addOrder(order);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      });
      if (res.ok) {
        const data = await res.json();
        return data.order || saved;
      }
    } catch (e) {
      console.warn('[storeService] addOrderAsync server error:', e);
    }
    return saved;
  },

  updateOrderStatus(orderId: string, status: OrderStatus): OrderDetails | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.orderId === orderId);
    if (index === -1) return null;

    orders[index] = {
      ...orders[index],
      status,
    };
    this.saveOrders(orders);

    // Sync status change to hosting server disk
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((err) => console.warn('[storeService] Failed to update order status on server:', err));

    return orders[index];
  },

  deleteOrder(orderId: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter((o) => o.orderId !== orderId);
    if (filtered.length !== orders.length) {
      this.saveOrders(filtered);

      // Sync deletion to hosting server disk
      fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('[storeService] Failed to delete order on server:', err));

      return true;
    }
    return false;
  },

  // ==========================================
  // CUSTOMER MANAGEMENT FOR ADMIN PANEL
  // ==========================================
  getCustomers(): CustomerUser[] {
    try {
      const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (raw) {
        const parsed: CustomerUser[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Permanently strip out test/dummy customers
          const realCustomers = parsed.filter(
            (c) =>
              c &&
              c.id &&
              !DUMMY_CUSTOMER_IDENTIFIERS.has(c.id) &&
              (!c.email || !DUMMY_CUSTOMER_IDENTIFIERS.has(c.email.toLowerCase()))
          );
          if (realCustomers.length !== parsed.length) {
            this.saveCustomers(realCustomers);
          }
          return realCustomers;
        }
      }
    } catch (e) {
      console.error('Failed to load customers from storage:', e);
    }
    return [];
  },

  async fetchCustomers(): Promise<CustomerUser[]> {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          const remoteCust = data.customers;
          const localCust = this.getCustomers();
          const map = new Map<string, CustomerUser>();
          localCust.forEach((c) => {
            const key = c.id || c.phone || c.email;
            if (key) map.set(key, c);
          });
          remoteCust.forEach((c: any) => {
            const key = c.id || c.phone || c.email;
            if (key) map.set(key, { ...(map.get(key) || {}), ...c });
          });
          const merged = Array.from(map.values());
          this.saveCustomers(merged);
          return merged;
        }
      }
    } catch (e) {
      console.warn('[storeService] Failed to fetch customers:', e);
    }
    return this.getCustomers();
  },

  saveCustomers(customers: CustomerUser[]): void {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
      window.dispatchEvent(new CustomEvent('trb_customers_updated', { detail: customers }));
    } catch (e) {
      console.error('Failed to save customers:', e);
    }
  },

  upsertCustomer(
    data: Partial<CustomerUser> & {
      name: string;
      email: string;
      totalOrdersIncrement?: number;
      totalSpentIncrement?: number;
    }
  ): CustomerUser {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(
      (c) => (data.id && c.id === data.id) || (data.email && c.email.toLowerCase() === data.email.toLowerCase())
    );

    if (existingIndex >= 0) {
      const existing = customers[existingIndex];
      const updated: CustomerUser = {
        ...existing,
        name: data.name || existing.name,
        phone: data.phone || existing.phone,
        address: data.address || existing.address,
        district: data.district || existing.district,
        deliveryZone: data.deliveryZone || existing.deliveryZone,
        provider: data.provider || existing.provider,
        avatar: data.avatar || existing.avatar,
        totalOrders: (existing.totalOrders || 0) + (data.totalOrdersIncrement || 0),
        totalSpent: (existing.totalSpent || 0) + (data.totalSpentIncrement || 0),
      };
      customers[existingIndex] = updated;
      this.saveCustomers(customers);
      return updated;
    } else {
      const newCustomer: CustomerUser = {
        id: data.id || `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        district: data.district || 'Dhaka',
        deliveryZone: data.deliveryZone || 'inside-dhaka',
        provider: data.provider || 'google',
        avatar:
          data.avatar ||
          (data.provider === 'facebook'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        joinedAt: new Date().toISOString(),
        totalOrders: data.totalOrdersIncrement || 1,
        totalSpent: data.totalSpentIncrement || 0,
      };
      const updatedList = [newCustomer, ...customers];
      this.saveCustomers(updatedList);
      return newCustomer;
    }
  },

  deleteCustomer(customerId: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter((c) => c.id !== customerId);
    if (filtered.length !== customers.length) {
      this.saveCustomers(filtered);
      return true;
    }
    return false;
  },
};
