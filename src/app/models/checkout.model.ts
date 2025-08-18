import { CartItem } from './cart-item.model';

export interface CheckoutData {
  customerInfo: CustomerInfo;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
  orderSummary: OrderSummary;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolderName?: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: CartItem[];
}