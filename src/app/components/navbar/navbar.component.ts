import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-navbar',
  template: `
  <mat-toolbar class="toolbar">
    <a class="nav-logo-link" [routerLink]="['/products']" aria-label="Go to products">
      <img src="assets/navlogo.png" alt="Logo" class="nav-logo">
    </a>
    <span class="spacer"></span>
    <div class="toolbar-buttons">
      <button mat-button routerLink="/products">
        <mat-icon>store</mat-icon>
        <span>Products</span>
      </button>

      <button mat-button routerLink="/cart"
              #cartMenuTrigger="matMenuTrigger"
              [matMenuTriggerFor]="cartPreview"
              (mouseenter)="openCartPreview(cartMenuTrigger)"
              [matBadge]="cartItemCount$ | async"
              matBadgeColor="warn"
              matBadgePosition="above before"
              [matBadgeHidden]="(cartItemCount$ | async) === 0">
        <mat-icon>shopping_cart</mat-icon>
        <span>Cart</span>
      </button>

      <mat-menu #cartPreview="matMenu"
                class="cart-preview-menu"
                [overlapTrigger]="false"
                yPosition="below"
                xPosition="after"
                (menuOpened)="onCartMenuOpened()"
                (menuClosed)="stopImageRotation()"
                (mouseenter)="cancelCloseCartPreview()"
                (mouseleave)="closeCartPreview(cartMenuTrigger)">
        <div class="cart-preview" *ngIf="cartItems$ | async as items">
          <ng-container *ngIf="items.length; else emptyCart">
            <div class="cart-item" *ngFor="let item of items">
              <div class="thumb" *ngIf="getImages(item) as imgs">
                <img [src]="imgs[getRotationIndex(item)] || imgs[0]"
                     [alt]="getTitle(item) || 'Product'">
              </div>
              <div class="info">
                <div class="title">{{ getTitle(item) }}</div>
                <div class="meta">Qty: {{ item.quantity }}</div>
              </div>
            </div>
            <div class="actions">
              <button mat-stroked-button color="primary" routerLink="/cart">View cart</button>
              <button mat-raised-button color="accent" routerLink="/checkout">Check out</button>
            </div>
          </ng-container>
          <ng-template #emptyCart>
            <div class="empty">
              <mat-icon class="empty-icon">remove_shopping_cart</mat-icon>
              <div>Your cart is empty</div>
            </div>
          </ng-template>
        </div>
      </mat-menu>
    </div>
  </mat-toolbar>
  `,
  styles: [`
  .toolbar {
    padding: 16px;
    position: relative;
    display: flex;
    align-items: center;
    background-color: #ffff; /* Light background for contrast */
  }

  .spacer {
    flex: 1 1 auto;
  }

  .toolbar-title {
    font-size: 18px;
    font-weight: bold;
  }

  .toolbar-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .button-label {
    margin-left: 4px;
  }

  .cart-preview-menu .mat-mdc-menu-content { padding: 0; }
  .cart-preview-menu .mat-mdc-menu-content { text-align: left; }
  .cart-item .info { text-align: left; }
  .cart-preview { width: 320px; max-height: 360px; overflow: auto; padding: 12px; }
  .cart-item { display: flex; gap: 8px; padding: 8px 4px; }
  .cart-item + .cart-item { border-top: 1px solid rgba(0,0,0,0.06); }
  .cart-item .thumb { width: 48px; height: 48px; border-radius: 4px; overflow: hidden; flex: 0 0 48px; }
  .cart-item .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cart-item .info { flex: 1 1 auto; min-width: 0; }
  .cart-item .title { font-size: 13px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cart-item .meta { font-size: 12px; opacity: 0.75; margin-top: 2px; }
  .actions { display: flex; gap: 8px; padding-top: 8px; justify-content: flex-start; flex-wrap: wrap; }
  .actions button { flex: 0 0 auto; }
  .empty { padding: 16px; text-align: center; opacity: 0.7; }
  .empty-icon {
    font-size: 48px;
    width: 48px;
    height: 48px;
    opacity: 0.5;
    margin-bottom: 8px;
  }

  .nav-logo {
    height: 80px;
    width: auto;
    max-width: 200px;
    object-fit: contain;
    margin-right: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .nav-logo {
      height: 60px;
      max-width: 150px;
    }
  }

  @media (max-width: 480px) {
    .nav-logo {
      height: 50px;
      max-width: 120px;
      margin-right: 8px;
    }

    .toolbar-buttons button span {
      display: none;
    }

    .toolbar-buttons button mat-icon {
      margin-right: 0;
    }
  }
  `]
})
export class NavbarComponent implements OnInit {
  cartItemCount$: Observable<number>;
  cartItems$!: Observable<any[]>;
  private cartCloseTimer: any;
  private rotationTimers: Record<string, any> = {};
  private rotationIndex: Record<string, number> = {};

  constructor(private cartService: CartService) {
    this.cartItemCount$ = this.cartService.getCartItems().pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
    this.cartItems$ = this.cartService.getCartItems();
  }

  ngOnInit(): void {}

  openCartPreview(trigger: MatMenuTrigger): void {
    clearTimeout(this.cartCloseTimer);
    trigger.openMenu();
  }

  scheduleCloseCartPreview(trigger: MatMenuTrigger): void {
    clearTimeout(this.cartCloseTimer);
    this.cartCloseTimer = setTimeout(() => trigger.closeMenu(), 500);
  }

  cancelCloseCartPreview(): void {
    clearTimeout(this.cartCloseTimer);
  }

  closeCartPreview(trigger: MatMenuTrigger): void {
    this.scheduleCloseCartPreview(trigger);
  }

  getImage(item: any): string | null {
    const p = item?.product || item;
    return p?.image || p?.imageUrl || p?.thumbnail || null;
  }

  getTitle(item: any): string {
    const p = item?.product || item;
    return p?.title || p?.name || '';
  }

  getImages(item: any): string[] {
    const p = item?.product || item;
    const list = (
      p?.images || p?.photos || p?.gallery || []
    ) as string[];
    const fallbacks = [p?.image, p?.imageUrl, p?.thumbnail].filter(Boolean) as string[];
    const imgs = (Array.isArray(list) ? list : []).concat(fallbacks);
    // de-dupe and keep truthy
    const seen = new Set<string>();
    return imgs.filter((src) => !!src && (seen.has(src) ? false : (seen.add(src), true)));
  }

  getProductKey(item: any): string {
    const p = item?.product || item;
    return String(p?.id || p?.sku || p?.title || p?.name || Math.random());
  }

  getRotationIndex(item: any): number {
    const key = this.getProductKey(item);
    return this.rotationIndex[key] ?? 0;
  }

  onCartMenuOpened(): void {
    this.cancelCloseCartPreview();
    this.cartItems$.pipe(take(1)).subscribe(items => this.startImageRotation(items));
  }

  startImageRotation(items: any[]): void {
    this.stopImageRotation();
    items.forEach(item => {
      const imgs = this.getImages(item);
      if (!imgs || imgs.length < 2) { return; }
      const key = this.getProductKey(item);
      this.rotationIndex[key] = this.rotationIndex[key] ?? 0;
      this.rotationTimers[key] = setInterval(() => {
        const len = imgs.length;
        const current = this.rotationIndex[key] ?? 0;
        this.rotationIndex[key] = (current + 1) % len;
      }, 2000);
    });
  }

  stopImageRotation(): void {
    Object.values(this.rotationTimers).forEach(t => clearInterval(t));
    this.rotationTimers = {};
  }
}