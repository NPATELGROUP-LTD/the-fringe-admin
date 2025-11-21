'use client';

import { useEffect } from 'react';
import { reportWebVitals, preloadCriticalResources, optimizeLCP, optimizeFID, preventLayoutShift } from '@/lib/web-vitals';

export function WebVitals() {
  useEffect(() => {
    // Initialize performance optimizations
    const initOptimizations = () => {
      preloadCriticalResources();
      optimizeLCP();
      optimizeFID();
      preventLayoutShift();
    };

    // Run optimizations after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initOptimizations);
    } else {
      initOptimizations();
    }

    // Clean up
    return () => {
      document.removeEventListener('DOMContentLoaded', initOptimizations);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Export the reportWebVitals function for Next.js
export { reportWebVitals };