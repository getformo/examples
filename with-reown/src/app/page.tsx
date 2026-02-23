'use client';

import React from 'react';
import { WalletEventTester } from '~/components/WalletEventTester';
import { CustomEventTest } from '~/components/CustomEventTest';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">FA</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Formo Analytics + Reown AppKit
          </h1>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Wallet Event Testing */}
          <section>
            <WalletEventTester />
          </section>

          {/* Custom Events */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Custom Event Tracking
            </h2>
            <CustomEventTest />
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-500">
            Powered by{' '}
            <a
              href="https://formo.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Formo Analytics
            </a>
            {' '}and{' '}
            <a
              href="https://reown.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Reown AppKit
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}