import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThirdwebProviderWrapper } from '@/components/thirdweb-provider';
import { AnalyticsProvider } from '@/components/analytics-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Formo Analytics x Thirdweb Integration',
  description: 'Example app demonstrating Formo Analytics integration with Thirdweb wallet connectivity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProviderWrapper>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </ThirdwebProviderWrapper>
      </body>
    </html>
  );
}
