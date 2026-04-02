import type { Metadata } from 'next';
import './globals.css';
import AppBottomNav from '@/components/layout/AppBottomNav';

export const metadata: Metadata = {
  title: 'Hipa - Shop Smart',
  description: 'Buy & sell across Africa',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#1a1a1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="max-w-full overflow-x-hidden">
        {/* Main Content */}
        <main className="pt-20">
          {children}
        </main>
        
        {/* Bottom Navigation */}
        <AppBottomNav />
      </body>
    </html>
  );
}
