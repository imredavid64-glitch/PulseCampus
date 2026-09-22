import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseCampus - Campus Mutual Aid & Study Pods',
  description: 'Real-time hyperlocal campus mutual aid and study pod matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}