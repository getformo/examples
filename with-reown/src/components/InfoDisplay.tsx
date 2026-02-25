'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface InfoDisplayProps {
  transactionHash?: `0x${string}`;
  signedMessage?: string;
}

export function InfoDisplay({ transactionHash, signedMessage }: InfoDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Transaction Hash Display */}
      {transactionHash && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Transaction Hash:</strong>
              <p className="break-all text-blue-800 font-mono">{transactionHash}</p>
              <a 
                href={`https://etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                View on Etherscan →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signed Message Display */}
      {signedMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <strong>Signature:</strong>
              <p className="break-all text-green-800 font-mono text-xs">
                {signedMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
