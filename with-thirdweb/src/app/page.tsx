'use client';

import { ConnectWallet } from '@/components/connect-wallet';
import { EventTester } from '@/components/event-tester';
import { useAddress } from '@thirdweb-dev/react';

export default function Home() {
  const address = useAddress();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Formo Analytics x Thirdweb Example
          </h1>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            <div className={`w-2 h-2 rounded-full mr-2 ${address ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            {address ? 'Wallet Connected' : 'Wallet Disconnected'}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <ConnectWallet />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <EventTester />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Built with{' '}
            <a href="https://thirdweb.com" className="text-blue-500 hover:text-blue-700">
              Thirdweb
            </a>{' '}
            and{' '}
            <a href="https://formo.ai" className="text-blue-500 hover:text-blue-700">
              Formo Analytics
            </a>
          </p>
          <p className="mt-2">
            This example demonstrates automatic event tracking for wallet interactions,
            signatures, transactions, and custom events.
          </p>
        </div>
      </div>
    </main>
  );
}
