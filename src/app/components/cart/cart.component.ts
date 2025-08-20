import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { CartItem } from '../../models/cart-item.model';
import { CartService } from '../../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-image-viewer',
  standalone: true, // Add this if it's standalone
  imports: [
    CommonModule,
    CurrencyPipe,
    AsyncPipe,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    // Add other required modules here
  ],
  template: `
    <div class="image-viewer-container">
      <div class="image-viewer-header">
        <div class="product-details">
          <h2>{{ data.productName }}</h2>
          <p class="product-description" *ngIf="data.productDescription">{{ data.productDescription }}</p>
          <div class="product-price" *ngIf="data.productPrice">{{ data.productPrice | currency }}</div>
        </div>
        <div class="header-controls">
          <span class="image-counter" *ngIf="data.images && data.images.length > 1">
            {{ currentIndex + 1 }} / {{ data.images.length || 0 }}
          </span>
          <button class="close-button" (click)="closeDialog()">
            <span>&times;</span>
          </button>
        </div>
      </div>
      
      <div class="image-viewer-content">
        <div class="image-container">
          <!-- Navigation arrows for multiple images -->
          <button class="nav-arrow left-arrow" 
                  *ngIf="data.images && data.images.length > 1"
                  (click)="previousImage()"
                  [disabled]="currentIndex === 0">
            &#8249;
          </button>
          
          <!-- Main image display -->
          <div class="main-image-wrapper">
            <img [src]="getCurrentImage()" 
                 [alt]="data.productName + ' image ' + (currentIndex + 1)" 
                 class="popup-image"
                 (wheel)="onWheel($event)"
                 [style.transform]="'scale(' + zoomLevel + ')'"
                 (mousedown)="startPan($event)"
                 (mousemove)="onPan($event)"
                 (mouseup)="endPan()"
                 (mouseleave)="endPan()">
          </div>
          
          <button class="nav-arrow right-arrow" 
                  *ngIf="data.images && data.images.length > 1"
                  (click)="nextImage()"
                  [disabled]="currentIndex === (data.images.length || 1) - 1">
            &#8250;
          </button>
        </div>
        
        <!-- Thumbnail strip for multiple images -->
        <div class="thumbnail-strip" *ngIf="data.images && data.images.length > 1">
          <div class="thumbnail-container">
            <img *ngFor="let image of data.images; let i = index" 
                 [src]="image" 
                 [alt]="data.productName + ' thumbnail ' + (i + 1)"
                 class="thumbnail"
                 [class.active]="i === currentIndex"
                 (click)="goToImage(i)">
          </div>
        </div>
      </div>
      
      <!-- Zoom controls -->
      <!--<div class="zoom-controls">
        <button class="zoom-btn" (click)="zoomOut()" [disabled]="zoomLevel <= 0.5">-</button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="zoom-btn" (click)="zoomIn()" [disabled]="zoomLevel >= 3">+</button>
        <button class="zoom-btn" (click)="resetZoom()">Reset</button>
      </div>-->
      <div class="zoom-controls">
        <button mat-icon-button (click)="zoomOut()" [disabled]="zoomLevel <= 0.5">
          <mat-icon>zoom_out</mat-icon>
        </button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <button mat-icon-button (click)="zoomIn()" [disabled]="zoomLevel >= 3">
          <mat-icon>zoom_in</mat-icon>
        </button>
        <button mat-icon-button (click)="resetZoom()">
          <mat-icon>center_focus_strong</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .image-viewer-container {
      max-width: 95vw;
      max-height: 95vh;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .image-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
      min-height: 80px;
    }
    .product-details {
      flex: 1;
      margin-right: 16px;
    }
    .image-viewer-header h2 {
      margin: 0 0 8px 0;
      font-size: 1.4em;
      color: #333;
    }
    .product-description {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 0.9em;
      line-height: 1.4;
    }
    .product-price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2196f3;
      margin: 0;
    }
    .header-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }
    .image-counter {
      font-weight: 500;
      color: #666;
      font-size: 0.9em;
    }
    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      color: #666;
      transition: background-color 0.2s;
    }
    .close-button:hover {
      background-color: #e0e0e0;
      color: #333;
    }
    .close-button span {
      font-weight: bold;
    }
    .image-viewer-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .image-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      background: #000;
      min-height: 400px;
    }
    .main-image-wrapper {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: grab;
    }
    .main-image-wrapper:active {
      cursor: grabbing;
    }
    .popup-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      transition: transform 0.1s ease;
      user-select: none;
    }
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      font-size: 24px;
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
      z-index: 10;
    }
    .nav-arrow:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.7);
    }
    .nav-arrow:disabled {
      background: rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
    }
    .left-arrow {
      left: 16px;
    }
    .right-arrow {
      right: 16px;
    }
    .thumbnail-strip {
      height: 100px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      overflow: hidden;
    }
    .thumbnail-container {
      display: flex;
      height: 100%;
      overflow-x: auto;
      padding: 8px;
      gap: 8px;
      align-items: center;
    }
    .thumbnail {
      height: 80px;
      width: 80px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s ease, transform 0.2s ease;
      flex-shrink: 0;
    }
    .thumbnail:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }
    .thumbnail.active {
      opacity: 1;
      border: 2px solid #2196f3;
    }
    .zoom-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: #f5f5f5;
    }
    .zoom-btn {
      background: #2196f3;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .zoom-btn:hover:not(:disabled) {
      background: #1976d2;
    }
    .zoom-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .zoom-level {
      min-width: 50px;
      text-align: center;
      font-weight: 500;
    }
  `]
})
export class ImageViewerComponent {
  currentIndex: number = 0;
  zoomLevel: number = 1;
  Math = Math;
  
  // Panning variables
  private isPanning = false;
  private startX = 0;
  private startY = 0;
  private translateX = 0;
  private translateY = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { 
      images?: string[];
      imageUrl?: string;
      productName: string;
      productDescription?: string;
      productPrice?: number;
    },
    private dialogRef: MatDialogRef<ImageViewerComponent>
  ) {
    this.currentIndex = 0;
  }

  getCurrentImage(): string {
    if (this.data.images && this.data.images.length > 0) {
      return this.data.images[this.currentIndex] || this.data.imageUrl || '';
    }
    return this.data.imageUrl || '';
  }

  nextImage(): void {
    if (this.data.images && this.currentIndex < this.data.images.length - 1) {
      this.currentIndex++;
      this.resetZoom();
    }
  }

  previousImage(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.resetZoom();
    }
  }

  goToImage(index: number): void {
    this.currentIndex = index;
    this.resetZoom();
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.25;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.25;
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, this.zoomLevel + delta));
    this.zoomLevel = newZoom;
  }

  startPan(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      this.isPanning = true;
      this.startX = event.clientX - this.translateX;
      this.startY = event.clientY - this.translateY;
    }
  }

  onPan(event: MouseEvent): void {
    if (this.isPanning && this.zoomLevel > 1) {
      this.translateX = event.clientX - this.startX;
      this.translateY = event.clientY - this.startY;
      
      const img = event.target as HTMLImageElement;
      img.style.transform = `scale(${this.zoomLevel}) translate(${this.translateX/this.zoomLevel}px, ${this.translateY/this.zoomLevel}px)`;
    }
  }

  endPan(): void {
    this.isPanning = false;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}


@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Confirm' }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message || 'Are you sure?' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText || 'Cancel' }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ data.confirmText || 'Yes' }}</button>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title?: string; message?: string; confirmText?: string; cancelText?: string }) {}
}

@Component({
  selector: 'app-cart',
  template: `
    <div class="container">
      <h2>Shopping Cart</h2>
      <div *ngIf="(cartItems$ | async)?.length === 0" class="empty-cart">
        <mat-icon class="large-icon">shopping_cart</mat-icon>
        <h3>Your cart is empty</h3>
        <button mat-raised-button color="primary" routerLink="/products">
          Continue Shopping
        </button>
      </div>
      <div *ngIf="(cartItems$ | async)?.length! > 0">
        <mat-card *ngFor="let item of cartItems$ | async" class="cart-item">
          <mat-card-content class="cart-item-content">
            
            <!-- Enhanced Image Carousel Container -->
            <div class="cart-image-container">
              <div class="cart-image-carousel" #carousel (scroll)="onCarouselScroll(carousel, item)">
                <div class="cart-image-wrapper" *ngFor="let image of getProductImages(item); let i = index">
                  <img [src]="image" 
                       [alt]="item.product.name + ' image ' + (i + 1)" 
                       class="cart-product-image clickable-image"
                       (click)="openImageViewer(item)"
                       title="Click to view larger image">
                </div>
              </div>
              
              <!-- Navigation buttons for multiple images -->
              <div class="cart-carousel-nav" *ngIf="getProductImages(item).length > 1">
                <button mat-icon-button class="cart-nav-btn cart-prev-btn" 
                        (click)="scrollCartCarousel(carousel, 'prev', item)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button mat-icon-button class="cart-nav-btn cart-next-btn" 
                        (click)="scrollCartCarousel(carousel, 'next', item)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              
              <!-- Image indicators -->
              <div class="cart-image-indicators" *ngIf="getProductImages(item).length > 1">
                <span *ngFor="let image of getProductImages(item); let i = index" 
                      class="cart-indicator" 
                      [class.active]="i === getActiveIndex(item)"
                      (click)="goToCartImage(carousel, i, item)"></span>
              </div>
              
              <!-- Zoom icon overlay -->
              <span class="zoom-icon">🔍</span>
            </div>
            
            <div class="product-details">
              <h3>{{ item.product.name }}</h3>
              <p>{{ item.product.description }}</p>
              <div class="price">{{ item.product.price | currency }}</div>
              <div class="image-count" *ngIf="getProductImages(item).length > 1">
                {{ getProductImages(item).length }} images
              </div>
            </div>
            <div class="quantity-controls">
              <button mat-icon-button (click)="decreaseQuantity(item.product.id!)">
                <mat-icon>remove</mat-icon>
              </button>
              <span class="quantity">{{ item.quantity }}</span>
              <button mat-icon-button (click)="increaseQuantity(item.product.id!)">
                <mat-icon>add</mat-icon>
              </button>
            </div>
            <div class="item-total">
              {{ (item.product.price * item.quantity) | currency }}
            </div>
            <button mat-icon-button color="warn" (click)="removeItem(item.product.id!)">
              <mat-icon>delete</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="cart-summary">
          <mat-card-content>
            <div class="summary-row">
              <span>Total Items: {{ getItemCount() }}</span>
            </div>
            <div class="summary-row total">
              <span>Total: {{ getTotal() | currency }}</span>
            </div>
            <div class="cart-actions">
              <button mat-raised-button color="warn" (click)="clearCart()">
                Clear Cart
              </button>
              <button mat-raised-button color="primary" (click)="checkout()">
                Checkout
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .empty-cart {
      text-align: center;
      padding: 50px;
    }
    .large-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ccc;
    }
    .cart-item {
      margin-bottom: 16px;
    }
    .cart-item-content {
      display: flex;
      align-items: flex-start; /* allow vertical stacking on wrap */
      gap: 16px;
      flex-wrap: wrap; /* prevent squishing on small screens */
    }
    
    /* Enhanced Cart Image Carousel Styles */
    .cart-image-container {
      position: relative;
      width: 120px;
      min-width: 120px;      /* ✅ keep image from shrinking */
      height: 120px;
      overflow: hidden;
      border-radius: 8px;
      cursor: pointer;
      flex: 0 0 120px;        /* ✅ reserve fixed space in flex layout */
      flex-shrink: 0;         /* ✅ do not allow shrinking below min-width */
    }
    .cart-image-carousel {
      display: flex;
      overflow-x: auto;
      scroll-behavior: smooth;
      height: 100%;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    .cart-image-carousel::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
    .cart-image-wrapper {
      flex: 0 0 100%;
      height: 100%;
    }
    .cart-product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .clickable-image:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    /* nav container: keep arrows vertically centered */
.cart-carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;        /* ⬅️ added */
  pointer-events: none;
  padding: 0 4px;
}

/* icon button itself */
.cart-nav-btn.mat-mdc-icon-button {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  width: 36px;                /* ⬅️ bigger, consistent target */
  height: 36px;
  padding: 0;
  display: inline-flex;       /* ⬅️ center the icon */
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

/* the icon */
.cart-nav-btn .mat-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  line-height: 1;
}

/* override MDC internals so they don't shift layout */
.cart-nav-btn.mat-mdc-icon-button .mat-mdc-button-touch-target {
  width: 36px;
  height: 36px;
}
.cart-nav-btn.mat-mdc-icon-button .mat-mdc-focus-indicator,
.cart-nav-btn.mat-mdc-icon-button .mat-mdc-button-persistent-ripple {
  position: absolute;
  inset: 0;
}
    .cart-nav-btn:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    .cart-image-indicators {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 2px;
    }
    .cart-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .cart-indicator.active {
      background: white;
    }
    .zoom-icon {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 12px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 50%;
      padding: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
    }
    .cart-image-container:hover .zoom-icon {
      opacity: 1;
    }
    .cart-image-container:hover .cart-carousel-nav {
      opacity: 1;
    }
    
    .product-details {
      flex: 1;
    }
    .product-details h3 {
      margin: 0 0 8px 0;
    }
    .product-details p {
      margin: 0 0 8px 0;
      color: #666;
    }
    .price {
      font-weight: bold;
      color: #2196f3;
    }
    .image-count {
      font-size: 0.8em;
      color: #888;
      margin-top: 4px;
    }
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .quantity {
      min-width: 30px;
      text-align: center;
      font-weight: bold;
    }
    .item-total {
      font-weight: bold;
      font-size: 1.1em;
      min-width: 80px;
      text-align: right;
    }
    .cart-summary {
      margin-top: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .summary-row.total {
      font-size: 1.2em;
      font-weight: bold;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }
    .cart-actions {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
  `]
})
export class CartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  
  // Track carousel index for each cart item
  cartCarouselIndices: { [key: string]: number } = {};

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router  // ✅ Added Router injection here
  ) {
    this.cartItems$ = this.cartService.getCartItems();
  }

  ngOnInit(): void {}

  /**
   * Get product images with fallback to imageUrl
   */
  getProductImages(item: CartItem): string[] {
    const product = item.product as any;
    
    // Check if product has images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter((img: string) => img && typeof img === 'string' && img.trim().length > 0);
    }
    
    // Fallback to single imageUrl
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0) {
      return [product.imageUrl];
    }
    
    return [];
  }

  /**
   * Get unique key for cart item
   */
  private getCartItemKey(item: CartItem): string {
    return (item.product as any).id || item.product.name || 'unknown';
  }

  /**
   * Get active carousel index for cart item
   */
  getActiveIndex(item: CartItem): number {
    const key = this.getCartItemKey(item);
    return this.cartCarouselIndices[key] || 0;
  }

  /**
   * Set active carousel index for cart item
   */
  setActiveIndex(item: CartItem, index: number): void {
    const key = this.getCartItemKey(item);
    this.cartCarouselIndices[key] = index;
  }

  /**
   * Handle carousel scroll event
   */
  onCarouselScroll(carousel: HTMLElement, item: CartItem): void {
    const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
    this.setActiveIndex(item, index);
  }

  /**
   * Scroll cart carousel programmatically
   */
  scrollCartCarousel(carousel: HTMLElement, direction: 'prev' | 'next', item: CartItem): void {
    const scrollAmount = carousel.clientWidth;
    const numImages = this.getProductImages(item).length;
    let currentIndex = this.getActiveIndex(item);
    
    if (direction === 'next') {
      if (currentIndex < numImages - 1) {
        currentIndex++;
      }
    } else {
      if (currentIndex > 0) {
        currentIndex--;
      }
    }
    
    carousel.scrollLeft = currentIndex * scrollAmount;
    this.setActiveIndex(item, currentIndex);
  }

  /**
   * Go to specific image in cart carousel
   */
  goToCartImage(carousel: HTMLElement, index: number, item: CartItem): void {
    carousel.scrollLeft = index * carousel.clientWidth;
    this.setActiveIndex(item, index);
  }

  /**
   * Open enhanced image viewer with carousel support
   */
  openImageViewer(item: CartItem): void {
    const images = this.getProductImages(item);
    const currentIndex = this.getActiveIndex(item);
    
    this.dialog.open(ImageViewerComponent, {
      data: { 
        images: images,
        imageUrl: images[currentIndex] || item.product.imageUrl,
        productName: item.product.name,
        productDescription: item.product.description,
        productPrice: item.product.price
      },
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '90vw',
      height: '90vh',
      panelClass: 'image-viewer-dialog'
    });
  }

  increaseQuantity(productId: string): void {
    this.cartService.getCartItems().pipe(
      take(1) // Only take the first emission
    ).subscribe(items => {
      const item = items.find(i => i.product.id === productId);
      if (item) {
        this.cartService.updateQuantity(productId, item.quantity + 1);
      }
    });
  }

  decreaseQuantity(productId: string): void {
    this.cartService.getCartItems().pipe(
      take(1) // Only take the first emission
    ).subscribe(items => {
      const item = items.find(i => i.product.id === productId);
      if (item && item.quantity > 1) {
        this.cartService.updateQuantity(productId, item.quantity - 1);
      }
    });
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
    this.snackBar.open('Item removed from cart', 'Close', { duration: 2000 });
  }

  clearCart(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Clear cart?',
        message: 'This will remove all items from your cart. Do you want to continue?',
        confirmText: 'Clear cart',
        cancelText: 'Keep items'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.cartService.clearCart();
        this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
      }
    });
  }

  getTotal(): number {
    return this.cartService.getCartTotal();
  }

  getItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  checkout(): void {
    // Check if cart is empty before navigating
    this.cartItems$.pipe(take(1)).subscribe(items => {
      if (items.length === 0) {
        this.snackBar.open('Your cart is empty. Add items before checkout.', 'Close', { 
          duration: 3000 
        });
        return;
      }
      
      // Navigate to checkout page
      this.router.navigate(['/checkout']);
    });
  }
}