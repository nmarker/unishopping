import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="background-container">
      <div class="repeating-bg"></div>
    </div>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <footer class="app-footer">
      <p>&copy; 2025 UniSparkle Shopping Store. All rights reserved.</p>
    </footer>
  `,
  styles: [`
    .background-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
    }

    .repeating-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/background.png');
      background-repeat: repeat;
      background-size: 600px 350px; /* Smaller repeating pattern */
      opacity: 0.4; /* Lighter opacity for better readability */
      background-position: center;
    }

    .app-footer {
      text-align: center;
      padding: 16px;
      background: linear-gradient(90deg, #e0f7fa 0%, #f1f8e9 100%);
      color: #333;
      font-size: 0.9rem;
      border-top: 1px solid #ddd;
      margin-top: 40px;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
      font-weight: 500;
      letter-spacing: 0.5px;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      overflow: hidden;
      z-index: 10;
    }
    .app-footer p:hover {
      transform: scale(1.05);
      transition: transform 0.3s ease;
    }
  `]
})
export class AppComponent {
  title = 'shopping-app';
}