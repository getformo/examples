import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Providers } from '~/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Formo Analytics - Reown AppKit Example',
  description: 'Example app demonstrating Reown AppKit integration with Formo Analytics SDK',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers cookies={cookies}>
          {children}
        </Providers>
      </body>
    </html>
  );
}