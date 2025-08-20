import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { FirebaseService } from '../../services/firebase.service';
import { CartService } from '../../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
// Enhanced Product interface to ensure images are included
interface ProductWithImages extends Product {
  images?: string[];
}

@Component({
  selector: 'app-product-list',

  standalone: true, // Add this if using standalone components
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    CurrencyPipe,
    AsyncPipe
  ],
  providers: [
    // Add the services that this component uses
    FirebaseService,
    CartService,
    MatSnackBar,
  ],
  template: `
    
    <div class="container">
      <h2>UniSparkle – Where every moment gets its glitter.</h2>
      <div class="hero-carousel" *ngIf="slides && slides.length" [style.background-image]="slides[currentSlide].bg">
        <button mat-icon-button class="hero-nav prev" (click)="prevSlide()" aria-label="Previous slide">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <div class="hero-content">
          <div class="hero-text">
            <h2 class="hero-title">{{ slides[currentSlide].title }}</h2>
            <p class="hero-subtitle">{{ slides[currentSlide].subtitle }}</p>
            <br><br><br><br><br>
            <button mat-raised-button color="accent">Shop Now</button>
          </div>
          <div class="hero-image">
            <img [src]="slides[currentSlide].image" alt="{{ slides[currentSlide].title }}">
          </div>
        </div>
        <button mat-icon-button class="hero-nav next" (click)="nextSlide()" aria-label="Next slide">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <div class="hero-dots">
          <span 
            *ngFor="let s of slides; let i = index" 
            class="dot" 
            [class.active]="i === currentSlide"
            (click)="goToSlide(i)"></span>
        </div>
      </div>
      <h2>Products</h2>
      <div *ngIf="products$ | async as products">
        <mat-tab-group class="category-tabs" mat-stretch-tabs="false" mat-align-tabs="start"
                        (selectedTabChange)="onTabChange($event, getCategories(products))">
          <mat-tab label="All"></mat-tab>
          <mat-tab *ngFor="let cat of getCategories(products)" [label]="cat"></mat-tab>
        </mat-tab-group>

        <div class="product-grid">
          <mat-card *ngFor="let product of filteredProducts(products)" class="product-card">
            <mat-card-header>
              <mat-card-title>{{ product.name }}</mat-card-title>
              <mat-card-subtitle>{{ product.category }}</mat-card-subtitle>
            </mat-card-header>
            
            <!-- Image Carousel for Product Card -->
            <div class="card-image-container">
              <div class="image-carousel" #carousel (scroll)="onCarouselScroll(carousel, product)">
                <div class="image-wrapper" *ngFor="let image of getProductImages(product); let i = index">
                  <img [src]="image" [alt]="product.name + ' image ' + (i + 1)" 
                       class="card-image clickable-image"
                       (click)="openImageDialog(getProductImages(product), i, product)">
                </div>
              </div>
              
              <!-- Navigation buttons for multiple images -->
              <div class="carousel-nav" *ngIf="getProductImages(product).length > 1">
                <button mat-icon-button class="nav-btn prev-btn" 
                        (click)="scrollCarousel(carousel, 'prev', product)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button mat-icon-button class="nav-btn next-btn" 
                        (click)="scrollCarousel(carousel, 'next', product)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              
              <!-- Image indicators -->
              <div class="image-indicators" *ngIf="getProductImages(product).length > 1">
                <span *ngFor="let image of getProductImages(product); let i = index" 
                      class="indicator" 
                      [class.active]="i === getActiveIndex(product)"></span>
              </div>
            </div>
            
            <mat-card-content>
              <p>{{ product.description }}</p>
              <div class="price">{{ product.price | currency }}</div>
              <div class="stock-status" [class.in-stock]="product.inStock" [class.out-of-stock]="!product.inStock">
                {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" 
                      [disabled]="!product.inStock"
                      (click)="addToCart(product)">
                Add to Cart
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      padding-bottom: 100px; /* Ensure footer doesn't overlap */
    }
    .category-tabs { margin-top: 8px; }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .product-card {
      max-width: 350px;
    }
    .price {
      font-size: 1.5em;
      font-weight: bold;
      color: #2196f3;
      margin: 10px 0;
    }
    .stock-status {
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .in-stock {
      background-color: #4caf50;
      color: white;
    }
    .out-of-stock {
      background-color: #f44336;
      color: white;
    }
    .clickable-image {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .clickable-image:hover {
      transform: scale(1.02);
    }
    .card-image-container {
      position: relative;
      overflow: hidden;
      height: 200px;
    }
    .image-carousel {
      display: flex;
      overflow-x: auto;
      scroll-behavior: smooth;
      height: 100%;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    .image-carousel::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
    .image-wrapper {
      flex: 0 0 100%;
      height: 100%;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .carousel-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }
    .nav-btn {
      pointer-events: auto;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      margin: 0 8px;
    }
    .nav-btn:hover {
      background: rgba(0, 0, 0, 0.7);
    }
    .image-indicators {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
    }
    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
    }
    .indicator.active {
      background: white;
    }
    .category-filter { margin-top: 8px; }

    .hero-carousel {
      position: relative;
      width: 100%;
      min-height: 80px;
      //border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      color: #2d3748; /* darker default text for contrast on light gold */
      /* Layered background: photo with dark overlay for contrast */
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      background-blend-mode: normal, normal;
      //box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* Update text colors for better contrast */
    .hero-title {
      color: #2d3748; /* Dark gray for titles */
      text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
    }
    .hero-subtitle {
      color: #4a5568; /* Medium gray for subtitles */
      text-shadow: 1px 1px 2px rgba(255,255,255,0.5);
    }
    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    .hero-image {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-image img {
      width: 100%;
      height: auto;
      max-height: 280px;
      object-fit: contain;
      filter: drop-shadow(0 10px 24px rgba(0,0,0,0.25));
    }
    .hero-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      background: rgba(0,0,0,0.25);
      color: #fff;
    }
    .hero-nav:hover {
      background: rgba(0,0,0,0.4);
    }
    .hero-nav.prev { left: 8px; }
    .hero-nav.next { right: 8px; }
    .hero-dots {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;
    }
    .hero-dots .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(0,0,0,0.25);
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .hero-dots .dot.active {
      background: rgba(0,0,0,0.6);
      transform: scale(1.15);
    }
    @media (max-width: 768px) {
      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-image img {
        max-height: 200px;
      }
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]>;
  selectedCategory: string = 'All';
  // Track carousel index for each product by name (or use product.id if available)
  carouselIndices: { [key: string]: number } = {};

  slides: Array<{ title: string; subtitle: string; image: string; bg: string }> = [];
  private carouselTimer: any;
  currentSlide: number = 0;

  constructor(
    private firebaseService: FirebaseService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.products$ = this.firebaseService.getProducts();
  }

  ngOnInit(): void {
    this.buildSlides();
    this.startAutoCycle();
  }

  ngOnDestroy(): void {
    this.clearAutoCycle();
  }

  private randomGradient(): string {
    const h1 = Math.floor(Math.random() * 360);
    const h2 = (h1 + 60 + Math.floor(Math.random() * 180)) % 360;
    const s1 = 70 + Math.floor(Math.random() * 20);
    const s2 = 70 + Math.floor(Math.random() * 20);
    const l1 = 50 + Math.floor(Math.random() * 10);
    const l2 = 45 + Math.floor(Math.random() * 10);
    return `linear-gradient(135deg, hsl(${h1} ${s1}% ${l1}%) 0%, hsl(${h2} ${s2}% ${l2}%) 100%)`;
  }

  private buildSlides(): void {
    const bgImages = [
      '/assets/carouselbackground_4.jpg',
      '/assets/carouselbackground_5.jpg',
      '/assets/carouselbackground_6.jpg',
      '/assets/carouselbackground_7.jpg'
    ];
    const gradient =
      "linear-gradient(180deg, rgba(255, 245, 141, 0.38) 0%, rgba(0,0,0,0.1) 25%, rgba(224, 224, 224, 0.2) 50%)";
    this.slides = [
      {
        title: 'Shine for Every Celebration',
        subtitle: 'Discover handcrafted ornaments that light up your moments.',
        image: 'assets/diwali_4.png',
        bg: `url('${bgImages[0 % bgImages.length]}')`
      },
      {
        title: 'Color, Craft & Joy',
        subtitle: 'Festive designs inspired by traditions around the world.',
        image: 'assets/diwali_3.png',
        bg: `url('${bgImages[1 % bgImages.length]}')`
      },
      {
        title: 'Make It Memorable',
        subtitle: 'Premium pieces for weddings, festivals, and parties.',
        image: 'assets/diwali_2.png',
        bg: `url('${bgImages[2 % bgImages.length]}')`
      }
    ];
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(i: number): void {
    if (i >= 0 && i < this.slides.length) {
      this.currentSlide = i;
    }
  }

  private startAutoCycle(): void {
    this.clearAutoCycle();
    this.carouselTimer = setInterval(() => this.nextSlide(), 5000);
  }

  private clearAutoCycle(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  /**
   * Enhanced addToCart method that ensures all product images are included
   */
  addToCart(product: Product): void {
    // Create an enhanced product object with all images included
    const productWithImages: ProductWithImages = {
      ...product,
      images: this.getProductImages(product)
    };

    // If the product doesn't have an images array, add it
    if (!(product as any).images) {
      (productWithImages as any).images = this.getProductImages(product);
    }

    // Log the product being added to cart (for debugging)
    console.log('Adding product to cart with images:', productWithImages);
    
    this.cartService.addToCart(productWithImages);
    this.snackBar.open(`${product.name} added to cart!`, 'Close', {
      duration: 2000
    });
  }

  /**
   * Enhanced method to get product images with better error handling
   */
  getProductImages(product: Product): string[] {
    // Check if product has images property and it's an array with content
    const productImages = (product as any).images;
    
    if (productImages && Array.isArray(productImages) && productImages.length > 0) {
      // Filter out any invalid/empty image URLs
      return productImages.filter(img => img && typeof img === 'string' && img.trim().length > 0);
    }
    
    // Fallback to imageUrl if available
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0) {
      return [product.imageUrl];
    }
    
    // Return empty array or placeholder if no images available
    return [];
  }

  getActiveIndex(product: Product): number {
    const key = this.getProductKey(product);
    return this.carouselIndices[key] || 0;
  }

  setActiveIndex(product: Product, index: number): void {
    const key = this.getProductKey(product);
    this.carouselIndices[key] = index;
  }

  /**
   * Helper method to get a unique key for the product
   * Uses product.id if available, otherwise falls back to product.name
   */
  private getProductKey(product: Product): string {
    return (product as any).id || product.name || 'unknown';
  }

  onCarouselScroll(carousel: HTMLElement, product: Product): void {
    const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
    this.setActiveIndex(product, index);
  }

  scrollCarousel(carousel: HTMLElement, direction: 'prev' | 'next', product: Product): void {
    const scrollAmount = carousel.clientWidth;
    const numImages = this.getProductImages(product).length;
    let currentIndex = this.getActiveIndex(product);
    
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
    this.setActiveIndex(product, currentIndex);
  }

  openImageDialog(images: string[], currentIndex: number = 0, product?: Product): void {
    const dialogRef = this.dialog.open(ImageDialogComponent, {
      data: { 
        images, 
        currentIndex,
        productName: product?.name,
        productDescription: product?.description,
        productPrice: product?.price,
        product: product
      },
      panelClass: 'image-dialog',
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '90vw',
      height: '90vh'
    });

    // Handle the result when dialog closes
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'addToCart' && result.product) {
        this.addToCart(result.product);
      }
    });
  }

  getCategories(products: Product[]): string[] {
    if (!products) { return []; }
    const cats = products.map(p => (p as any).category).filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b));
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  onTabChange(event: MatTabChangeEvent, categories: string[]): void {
    if (!categories) { categories = []; }
    if (event.index === 0) {
      this.setCategory('All');
    } else {
      const cat = categories[event.index - 1];
      this.setCategory(cat || 'All');
    }
  }

  filteredProducts(products: Product[]): Product[] {
    if (this.selectedCategory === 'All') { return products; }
    return products.filter(p => (p as any).category === this.selectedCategory);
  }
}


@Component({
  selector: 'app-image-dialog',
  standalone: true, // Add this if using standalone components
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    CurrencyPipe
  ],
  template: `
    <div class="dialog-header">
      <div class="product-details">
        <h3 class="product-name" *ngIf="data.productName">{{ data.productName }}</h3>
        <p class="product-description" *ngIf="data.productDescription">{{ data.productDescription }}</p>
        <div class="price-row" *ngIf="data.productPrice || data.product">
          <div class="product-price" *ngIf="data.productPrice">{{ data.productPrice | currency }}</div>
          <button mat-raised-button color="primary" 
                  class="add-to-cart-btn"
                  *ngIf="data.product"
                  [disabled]="!data.product.inStock"
                  (click)="addToCart()">
            Add to Cart
          </button>
        </div>
      </div>
      <div class="header-controls">
        <span class="image-counter">{{ currentIndex + 1 }} / {{ data.images.length }}</span>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    
    <div mat-dialog-content class="dialog-content">
      <div class="image-container">
        <!-- Navigation arrows -->
        <button mat-icon-button class="nav-arrow left-arrow" 
                *ngIf="data.images.length > 1"
                (click)="previousImage()"
                [disabled]="currentIndex === 0">
          <mat-icon>chevron_left</mat-icon>
        </button>
        
        <!-- Main image display -->
        <div class="main-image-wrapper">
          <img [src]="data.images[currentIndex]" 
               [alt]="'Image ' + (currentIndex + 1)" 
               class="dialog-image"
               (wheel)="onWheel($event)"
               [style.transform]="'scale(' + zoomLevel + ')'"
               (mousedown)="startPan($event)"
               (mousemove)="onPan($event)"
               (mouseup)="endPan()"
               (mouseleave)="endPan()">
        </div>
        
        <button mat-icon-button class="nav-arrow right-arrow" 
                *ngIf="data.images.length > 1"
                (click)="nextImage()"
                [disabled]="currentIndex === data.images.length - 1">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
      
      <!-- Thumbnail strip -->
      <div class="thumbnail-strip" *ngIf="data.images && data.images.length > 1">
        <div class="thumbnail-container">
          <img *ngFor="let image of data.images; let i = index" 
               [src]="image" 
               [alt]="'Thumbnail ' + (i + 1)"
               class="thumbnail"
               [class.active]="i === currentIndex"
               (click)="goToImage(i)">
        </div>
      </div>
    </div>
    
    <div mat-dialog-actions class="dialog-actions">
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
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      min-height: 80px;
    }
    .product-details {
      flex: 1;
      margin-right: 16px;
    }
    .product-name {
      margin: 0 0 8px 0;
      font-size: 1.4em;
      font-weight: 600;
      color: #333;
    }
    .product-description {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 0.9em;
      line-height: 1.4;
    }
    .price-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .product-price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2196f3;
      margin: 0;
    }
    .add-to-cart-btn {
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
    .close-btn {
      color: #666;
    }
    .dialog-content {
      padding: 0 !important;
      margin: 0 !important;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: visible; /* allow the thumbnail strip to be shown */
    }
    .image-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 auto;      /* take remaining space above thumbnails */
      min-height: 0;        /* allow flexbox to shrink properly */
      background: #000;
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
    .dialog-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      transition: transform 0.1s ease;
      user-select: none;
      pointer-events: auto;
    }
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.5);
      color: white;
      z-index: 10;
      width: 48px;
      height: 48px;
    }
    .nav-arrow:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.7);
    }
    .nav-arrow:disabled {
      background: rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.3);
    }
    .left-arrow {
      left: 16px;
    }
    .right-arrow {
      right: 16px;
    }
    .thumbnail-strip {
      flex: 0 0 100px; /* reserve space at the bottom for thumbnails */
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
    .dialog-actions {
      display: flex;
      justify-content: center;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .zoom-level {
      min-width: 50px;
      text-align: center;
      font-weight: 500;
    }
  `]
})
export class ImageDialogComponent {
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
      images: string[], 
      currentIndex: number,
      productName?: string,
      productDescription?: string,
      productPrice?: number,
      product?: Product
    },
    public dialogRef: MatDialogRef<ImageDialogComponent>
  ) {
    this.currentIndex = data.currentIndex || 0;
  }

  addToCart(): void {
    if (this.data.product) {
      // Return the product with images to the parent component
      this.dialogRef.close({ 
        action: 'addToCart', 
        product: {
          ...this.data.product,
          images: this.data.images
        }
      });
    }
  }

  nextImage(): void {
    if (this.currentIndex < this.data.images.length - 1) {
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
}