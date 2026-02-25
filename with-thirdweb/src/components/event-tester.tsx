'use client';

import { useState } from 'react';
import { useAddress, useSigner } from '@thirdweb-dev/react';
import { useFormo } from '@formo/analytics';

export function EventTester() {
  const address = useAddress();
  const signer = useSigner();
  const formo = useFormo();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Hello from Formo Analytics!');
  const [customEventName, setCustomEventName] = useState('Custom Test Event');
  const [customEventData, setCustomEventData] = useState('{"key": "value", "timestamp": "' + new Date().toISOString() + '"}');

  const handleSignMessage = async () => {
    if (!signer || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      const signature = await signer.signMessage(message);
      
      alert('Message signed successfully!');
    } catch (error) {
      console.error('Failed to sign message:', error);
      alert('Failed to sign message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!signer || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a simple transaction (sending 0 ETH to self)
      const tx = await signer.sendTransaction({
        to: address,
        value: '0',
        data: '0x',
      });

      alert(`Transaction sent! Hash: ${tx.hash}`);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      alert('Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomEvent = () => {
    try {
      const parsedData = JSON.parse(customEventData);
      const eventData = {
        ...parsedData,
        wallet_address: address,
        triggered_manually: true,
        timestamp: new Date().toISOString(),
      };
      
      if (formo) {
        formo.track(customEventName, eventData);
      }
      alert('Custom event sent!');
    } catch (error) {
      alert('Invalid JSON in custom event data');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">SDK Event Testing</h2>
      
      <div className="space-y-6">
        {/* Signature Testing */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Signature Testing</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to sign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSignMessage}
              disabled={!address || isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Signing...' : 'Sign Message'}
            </button>
          </div>
        </div>

        {/* Transaction Testing */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Transaction Testing</h3>
          <button
            onClick={handleSendTransaction}
            disabled={!address || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Test Transaction (0 ETH to self)'}
          </button>
        </div>

        {/* Custom Events */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Custom Events</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={customEventName}
              onChange={(e) => setCustomEventName(e.target.value)}
              placeholder="Event name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={customEventData}
              onChange={(e) => setCustomEventData(e.target.value)}
              placeholder="Event data (JSON)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCustomEvent}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Send Custom Event
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
