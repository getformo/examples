'use client'

import { useEffect, useState } from 'react'
import { useFormo } from '@formo/analytics'

interface LogEvent {
  id: string
  timestamp: string
  type: string
  data: Record<string, unknown>
}

export function EventLogger() {
  const [events, setEvents] = useState<LogEvent[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const analytics = useFormo()

  useEffect(() => {
    // Override the track method to capture events for logging
    const originalTrack = analytics.track
    analytics.track = (event: string, properties?: Record<string, unknown>) => {
      const logEvent: LogEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: event,
        data: properties || {},
      }
      
      setEvents(prev => [logEvent, ...prev.slice(0, 49)]) // Keep last 50 events
      
      // Call the original track method
      return originalTrack.call(analytics, event, properties)
    }

    return () => {
      analytics.track = originalTrack
    }
  }, [analytics])

  const clearEvents = () => {
    setEvents([])
  }

  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `formo-events-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        Events ({events.length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Event Log</h3>
            <div className="flex gap-2">
              <button
                onClick={exportEvents}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                disabled={events.length === 0}
              >
                Export
              </button>
              <button
                onClick={clearEvents}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                disabled={events.length === 0}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No events logged yet
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="border-b border-gray-100 p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-blue-600 text-sm">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {Object.keys(event.data).length > 0 && (
                    <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
