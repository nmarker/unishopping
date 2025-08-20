import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { CartItem } from '../../models/cart-item.model';
import { CheckoutData, OrderSummary } from '../../models/checkout.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  customerForm!: FormGroup;  // Using definite assignment assertion
  shippingForm!: FormGroup;  // Using definite assignment assertion
  paymentForm!: FormGroup;   // Using definite assignment assertion
  
  cartItems$: Observable<CartItem[]>;
  orderSummary: OrderSummary | null = null;
  isProcessing = false;

  // Convenience getters for template state
  get isFormInvalid(): boolean {
    return (
      !this.orderSummary ||
      this.customerForm.invalid ||
      this.shippingForm.invalid ||
      this.paymentForm.invalid ||
      this.isProcessing
    );
  }

  // Better *ngFor performance in templates
  trackByCartItem(index: number, item: CartItem) {
    const anyItem: any = item as any;
    return anyItem.id ?? anyItem.productId ?? anyItem.sku ?? index;
  }

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.getCartItems();
    this.initializeForms(); // Initialize forms in constructor
  }

  ngOnInit(): void {
    this.cartItems$.subscribe(items => {
      if (items.length === 0) {
        this.router.navigate(['/cart']);
        this.snackBar.open('Your cart is empty', 'Close', { duration: 3000 });
        return;
      }
      this.orderSummary = this.checkoutService.calculateOrderSummary(items);
    });
  }

  private initializeForms(): void {
    this.customerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });

    this.shippingForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['US', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentType: ['credit_card', Validators.required],
      cardHolderName: [''],
      cardNumber: [''],
      expiryDate: [''],
      cvv: ['']
    });

    // Add conditional validators for card details
    this.paymentForm.get('paymentType')?.valueChanges.subscribe(type => {
      const cardFields = ['cardHolderName', 'cardNumber', 'expiryDate', 'cvv'];
      
      if (type === 'credit_card' || type === 'debit_card') {
        cardFields.forEach(field => {
          this.paymentForm.get(field)?.setValidators([Validators.required]);
        });
      } else {
        cardFields.forEach(field => {
          this.paymentForm.get(field)?.clearValidators();
        });
      }
      
      cardFields.forEach(field => {
        this.paymentForm.get(field)?.updateValueAndValidity();
      });
    });
  }

  // Method to get product images (needed for template)
  getProductImages(item: CartItem): string[] {
    const product = item.product as any;
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img: string) => img && typeof img === 'string' && img.trim().length > 0);
    }
    
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0) {
      return [product.imageUrl];
    }
    
    return ['/assets/placeholder-image.jpg']; // Add a placeholder image
  }

  processCheckout(): void {
    // Validate all sections before proceeding
    this.customerForm.markAllAsTouched();
    this.shippingForm.markAllAsTouched();
    this.paymentForm.markAllAsTouched();
    if (this.customerForm.invalid || this.shippingForm.invalid || this.paymentForm.invalid) {
      this.snackBar.open('Please fix the highlighted fields before continuing.', 'Close', { duration: 4000 });
      return;
    }

    if (!this.orderSummary) return;

    this.isProcessing = true;

    const checkoutData: CheckoutData = {
      customerInfo: this.customerForm.value,
      shippingAddress: this.shippingForm.value,
      paymentMethod: this.paymentForm.value,
      orderSummary: this.orderSummary
    };

    this.checkoutService.processPayment(checkoutData).subscribe({
      next: (result) => {
        this.isProcessing = false;
        
        if (result.success && result.orderId) {
          // Clear the cart
          this.cartService.clearCart();
          
          // Send confirmation email
          this.checkoutService.sendOrderConfirmation(
            result.orderId, 
            checkoutData.customerInfo.email
          ).subscribe();
          
          // Show success message
          this.snackBar.open(
            `Order placed successfully! Order ID: ${result.orderId}`, 
            'Close', 
            { duration: 5000 }
          );
          
          // Navigate to home or order confirmation
          this.router.navigate(['/']);
        } else {
          this.snackBar.open(
            result.error || 'Payment failed. Please try again.', 
            'Close', 
            { duration: 5000 }
          );
        }
      },
      error: (error) => {
        this.isProcessing = false;
        this.snackBar.open('An error occurred. Please try again.', 'Close', { duration: 5000 });
        console.error('Checkout error:', error);
      }
    });
  }
}