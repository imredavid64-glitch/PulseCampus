import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DEFAULT_SCHOOL_CONFIG } from '@/lib/school-config';
import { ThemeProvider } from '@/context/ThemeContext';
import { SentryProvider, SentryErrorBoundary } from '@/components/SentryProvider';

export const metadata: Metadata = {
  title: 'PulseCampus - Campus Mutual Aid & Study Pods',
  description: 'Real-time hyperlocal campus mutual aid and study pod matching',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PulseCampus',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: DEFAULT_SCHOOL_CONFIG.primaryColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PulseCampus" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased">
        <SentryProvider>
          <ThemeProvider>
            <ToastProvider>
              <SentryErrorBoundary fallback={<div className="p-8 text-center text-gray-600 dark:text-gray-400">Something went wrong. Please refresh the page.</div>}>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </SentryErrorBoundary>
            </ToastProvider>
          </ThemeProvider>
        </SentryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}