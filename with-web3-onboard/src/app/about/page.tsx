'use client'

export default function AboutPage() {
  // Page views are automatically tracked by Formo SDK


  return (
    <div className="space-y-8">
      {/* Technologies */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Technologies Used</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-blue-600 mb-2">Formo Analytics</h3>
            <p className="text-sm text-gray-600">
              Web3-native analytics platform that helps you understand user behavior 
              in decentralized applications with automatic wallet event tracking.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-blue-600 mb-2">Web3 Onboard</h3>
            <p className="text-sm text-gray-600">
              Multi-wallet connection library that provides a seamless experience 
              for connecting various Web3 wallets to your dApp.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-blue-600 mb-2">Next.js 15</h3>
            <p className="text-sm text-gray-600">
              React framework with App Router, TypeScript support, and optimized 
              performance for modern web applications.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-semibold text-blue-600 mb-2">Tailwind CSS</h3>
            <p className="text-sm text-gray-600">
              Utility-first CSS framework for rapidly building custom user interfaces 
              with responsive design capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Key Features</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Multi-Wallet Support</h3>
              <p className="text-sm text-gray-600">Connect with MetaMask, Coinbase Wallet, WalletConnect, and other injected wallets.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Automatic Event Tracking</h3>
              <p className="text-sm text-gray-600">Page views, wallet connections, chain changes, signatures, and transactions are tracked automatically.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Multi-Chain Support</h3>
              <p className="text-sm text-gray-600">Support for Ethereum, Polygon, Optimism, and Base networks with easy chain switching.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Real-time Event Logging</h3>
              <p className="text-sm text-gray-600">Debug and verify events in your browser&apos;s developer console and network tab.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Custom Event Tracking</h3>
              <p className="text-sm text-gray-600">Track custom application-specific events with flexible data structures.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Getting Started</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">1. Set up Formo Analytics</h3>
            <p className="text-sm text-gray-600">
              Sign up at <a href="https://formo.so" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">formo.so</a> and 
              get your write key to start tracking events.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">2. Configure Environment</h3>
            <p className="text-sm text-gray-600">
              Copy <code className="bg-gray-200 px-1 rounded">.env.example</code> to <code className="bg-gray-200 px-1 rounded">.env.local</code> and 
              add your Formo write key and WalletConnect project ID.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">3. Install Dependencies</h3>
            <p className="text-sm text-gray-600">
              Run <code className="bg-gray-200 px-1 rounded">npm install</code> to install all required dependencies.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">4. Start Development</h3>
            <p className="text-sm text-gray-600">
              Run <code className="bg-gray-200 px-1 rounded">npm run dev</code> to start the development server.
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Useful Links</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://formo.so"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Formo Analytics</h3>
              <p className="text-sm text-gray-600">Official website and documentation</p>
            </div>
          </a>
          
          <a
            href="https://github.com/thirdweb-dev/web3-onboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Web3 Onboard</h3>
              <p className="text-sm text-gray-600">GitHub repository and documentation</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
