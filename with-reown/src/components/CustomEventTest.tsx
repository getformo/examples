'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useFormo } from '@formo/analytics';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function CustomEventTest() {
  const { isConnected, address } = useAccount();
  const formo = useFormo();

  const trackCustomEvent = (eventName: string, properties: any = {}) => {
    formo?.track(eventName, {
      ...properties,
      address,
      timestamp: new Date().toISOString(),
    });
  };

  const testEvent = {
    name: 'Button Clicked',
    description: 'Track a simple button click event',
    properties: { 
      buttonType: 'custom-event-test',
      timestamp: new Date().toISOString()
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Event Tracking</CardTitle>
        <CardDescription>
          Test custom analytics events - works with or without wallet connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800">{testEvent.name}</h3>
            <p className="text-sm text-gray-600">{testEvent.description}</p>
          </div>
          
          <Button
            onClick={() => trackCustomEvent(testEvent.name, testEvent.properties)}
            className="w-full"
            variant="default"
          >
            Track "{testEvent.name}"
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}