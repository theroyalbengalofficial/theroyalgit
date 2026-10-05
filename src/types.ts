export type HuntCategory = 'signature' | 'boardroom' | 'daily' | '24x7' | 'holiday' | 'weekend';

export interface ProductMeasurement {
  size: string;
  length: number;
  chest: number;
  sleeveLength: number;
}

export interface ColorOption {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  styleCode: string;
  category: HuntCategory;
  price: number;
  currency: string;
  description: string;
  fabric: string;
  color: string;
  colorOptions: ColorOption[];
  sizes: string[];
  image: string;
  gallery: string[];
  measurements: ProductMeasurement[];
  badge?: string;
  isNewArrival?: boolean;
  stock?: number;
  sizeStock?: Record<string, number>;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export type ActivePage = 
  | 'home' 
  | 'choose-hunt' 
  | 'new-arrivals' 
  | 'try-on' 
  | 'manifesto' 
  | 'shop' 
  | 'product-detail' 
  | 'cart' 
  | 'checkout' 
  | 'about' 
  | 'exchange';

export interface PaymentGatewayKeys {
  bkashMerchantId: string;
  bkashAppKey: string;
  bkashAppSecret: string;
  nagadMerchantId: string;
  nagadPublicKey: string;
  nagadPrivateKey: string;
  isSandbox: boolean;
}

export type AuthProvider = 'google' | 'facebook' | 'email';
export type DeliveryZone = 'inside-dhaka' | 'outside-dhaka';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  district?: string;
  deliveryZone?: DeliveryZone;
  provider: AuthProvider;
  avatar?: string;
  joinedAt: string;
  totalOrders?: number;
  totalSpent?: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export interface OrderDetails {
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  deliveryMethod: 'inside-dhaka' | 'outside-dhaka' | '2hour-dhaka' | 'standard';
  paymentMethod: 'bkash' | 'nagad' | 'card' | 'cod';
  authProvider?: AuthProvider;
  items: CartItem[];
  subtotal: number;
  discount: number;
  vat: number;
  shipping: number;
  total: number;
  status: OrderStatus | 'pending' | 'confirmed' | 'processing';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'manager';
}
