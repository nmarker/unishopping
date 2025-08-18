import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { CartItem } from '../models/cart-item.model';
import { CheckoutData, OrderSummary } from '../models/checkout.model';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  
  calculateOrderSummary(cartItems: CartItem[]): OrderSummary {
    const subtotal = cartItems.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
    
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round(total * 100) / 100,
      items: cartItems
    };
  }

  processPayment(checkoutData: CheckoutData): Observable<{ success: boolean; orderId?: string; error?: string }> {
    // Simulate payment processing
    return of(null).pipe(
      delay(2000), // Simulate network delay
      map(() => {
        // Simulate payment success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        if (success) {
          const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          return { success: true, orderId };
        } else {
          return { success: false, error: 'Payment failed. Please try again.' };
        }
      })
    );
  }

  sendOrderConfirmation(orderId: string, customerEmail: string): Observable<boolean> {
    // Simulate sending confirmation email
    console.log(`Sending order confirmation for ${orderId} to ${customerEmail}`);
    return of(true).pipe(delay(1000));
  }
}