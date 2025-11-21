import { NextWebVitalsMetric } from 'next/app';

// Web Vitals tracking
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }

  // Send to analytics service (placeholder)
  // You can integrate with Google Analytics, Vercel Analytics, etc.
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
  });

  // Example: Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/web-vitals', body);
  } else {
    fetch('/api/web-vitals', { body, method: 'POST', keepalive: true });
  }
}

// CLS optimization: Reserve space for images and dynamic content
export function preloadCriticalResources() {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // Preload critical images
  const criticalImages = document.querySelectorAll('img[data-critical]');
  criticalImages.forEach((img) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = (img as HTMLImageElement).src;
    link.as = 'image';
    document.head.appendChild(link);
  });
}

// LCP optimization: Prioritize above-the-fold content
export function optimizeLCP() {
  // Add priority hints for critical images
  const lcpImages = document.querySelectorAll('img[data-lcp]');
  lcpImages.forEach((img) => {
    (img as HTMLImageElement).loading = 'eager';
    (img as HTMLImageElement).fetchPriority = 'high';
  });
}

// FID optimization: Reduce JavaScript execution time
export function optimizeFID() {
  // Defer non-critical JavaScript
  const scripts = document.querySelectorAll('script[data-defer]');
  scripts.forEach((script) => {
    (script as HTMLScriptElement).defer = true;
  });
}

// CLS optimization: Set dimensions for dynamic content
export function preventLayoutShift() {
  // Set aspect ratios for images
  const images = document.querySelectorAll('img:not([width])');
  images.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    if (!imgElement.complete) {
      // Set a default aspect ratio to prevent CLS
      imgElement.style.aspectRatio = '16/9';
    }
  });

  // Reserve space for dynamic content
  const dynamicElements = document.querySelectorAll('[data-dynamic]');
  dynamicElements.forEach((el) => {
    const element = el as HTMLElement;
    // Set minimum height to prevent layout shifts
    if (!element.style.minHeight) {
      element.style.minHeight = '24px';
    }
  });
}