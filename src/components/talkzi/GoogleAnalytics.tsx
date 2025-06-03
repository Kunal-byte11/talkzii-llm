
"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event',
      targetId: string,
      config?: { page_path?: string; [key: string]: any }
    ) => void;
  }
}

interface GoogleAnalyticsProps {
  GA_MEASUREMENT_ID: string;
}

export const GoogleAnalytics = ({ GA_MEASUREMENT_ID }: GoogleAnalyticsProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') {
      return;
    }

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Log to console for debugging purposes (optional)
    // console.log(`GA: page_view event sent for ${url} with ID ${GA_MEASUREMENT_ID}`);

    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });

  }, [pathname, searchParams, GA_MEASUREMENT_ID]);

  return null; // This component does not render anything visible
};
