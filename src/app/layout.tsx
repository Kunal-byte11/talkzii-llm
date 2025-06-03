
import type { Metadata } from 'next';
import Script from 'next/script'; // Import Script
import { Plus_Jakarta_Sans, Noto_Sans, Geist_Mono, Poppins, Hind } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"; // Renamed to avoid conflict
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from '@/contexts/AuthContext';
import { GoogleAnalytics } from '@/components/talkzi/GoogleAnalytics'; // Import the new component

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '700', '800'],
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '500', '700', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
});

const hind = Hind({ // Serif-style font for Wise Dadi
  subsets: ['latin'],
  variable: '--font-hind',
  weight: ['400', '500', '600', '700'],
});

// IMPORTANT: Replace "YOUR_GA_MEASUREMENT_ID" with your actual Google Analytics 4 Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "YOUR_GA_MEASUREMENT_ID";

export const metadata: Metadata = {
  title: 'Talkzi AI - Your Desi Bestie',
  description: 'AI-powered emotional support assistant for Gen Z in India.',
  manifest: '/manifest.json',
  themeColor: '#F5F8FF', 
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'default',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${plusJakartaSans.variable} ${notoSans.variable} ${geistMono.variable} ${hind.variable}`}>
      <head>
        {/* Google Analytics Scripts - Only add if GA_MEASUREMENT_ID is set and not the placeholder */}
        {GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "YOUR_GA_MEASUREMENT_ID" && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`antialiased flex flex-col min-h-screen bg-background text-foreground font-poppins`}>
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          <Toaster />
          <VercelAnalytics /> 
          <SpeedInsights />
          {/* Render GoogleAnalytics component for page view tracking */}
          {GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "YOUR_GA_MEASUREMENT_ID" && (
            <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
