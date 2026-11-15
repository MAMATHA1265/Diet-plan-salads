export interface Plan {
  _id: string;
  name: string;
  slug: 'basic' | 'standard' | 'premium';
  tagline: string;
  saladsPerDay: number;
  daysPerMonth: number;
  monthlyPrice: number;
  discountPercent: number;
  freeDelivery: boolean;
  features: string[];
  isActive: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'member';
  planId?: string | null;
  plan?: Plan | null;
  activeSubscriptionId?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Salad {
  _id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  dietaryType: 'veg' | 'vegan' | 'high-protein';
  tags: string[];
  ingredientsList: string[];
  imageUrl: string;
  isAvailable: boolean;
  featured: boolean;
}

export interface Ingredient {
  _id: string;
  name: string;
  category: 'base' | 'protein' | 'topping' | 'dressing';
  price: number;
  calories: number;
  protein: number;
  dietaryTag: 'vegan' | 'veg' | 'non-veg';
  isAvailable: boolean;
}

export interface CustomSalad {
  _id: string;
  userId: string;
  name: string;
  baseId: string;
  baseName: string;
  proteinIds: string[];
  proteinNames: string[];
  toppingIds: string[];
  toppingNames: string[];
  dressingId: string;
  dressingName: string;
  specialInstructions: string;
  totalPrice: number;
  totalCalories: number;
  totalProtein: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  saladId?: string;
  name: string;
  unitPrice: number;
  calories: number;
  quantity: number;
  imageUrl?: string;
  isCustom?: boolean;
  customDetails?: {
    base: string;
    proteins: string[];
    toppings: string[];
    dressing: string;
    specialInstructions?: string;
  };
}

export interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  plan?: Plan | null;
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  endDate: string;
  pausedAt?: string | null;
  deliveryAddress: string;
  timeSlot: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  autoRenew: boolean;
  memberName?: string;
  memberEmail?: string;
  planName?: string;
  monthlyPrice?: number;
}

export interface OrderItem {
  saladId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  isCustom?: boolean;
  customDetails?: {
    base: string;
    proteins: string[];
    toppings: string[];
    dressing: string;
    specialInstructions?: string;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  timeSlot: string;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  orderType: 'one-time' | 'subscription';
  subscriptionId?: string | null;
  scheduledDate: string;
  paymentStatus: 'paid' | 'pending';
  paymentId?: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface MemberRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'member';
  planId: string | null;
  planName: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  _id: string;
  userId?: string | null;
  memberName: string;
  memberEmail: string;
  phone: string;
  goal: string;
  appointmentDate: string;
  timeSlot: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

