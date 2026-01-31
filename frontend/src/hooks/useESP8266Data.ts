import { useEffect, useState, useRef } from 'react';

export interface ESP8266Data {
  current: number;
  voltage: number;
  load: boolean;
  overcurrent: boolean;
  uptime: number;
  temperature: number;
  timestamp: number;
}

interface UseESP8266DataReturn {
  data: ESP8266Data | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isConnected: boolean;
  currentHistory: Array<{ time: number; value: number }>;
}

const POLL_INTERVAL = 750; // 750ms polling interval
const MAX_HISTORY_LENGTH = 80; // ~60 seconds of data at 750ms intervals
const API_ENDPOINT = '/api/data';

export function useESP8266Data(): UseESP8266DataReturn {
  const [data, setData] = useState<ESP8266Data | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentHistory, setCurrentHistory] = useState<Array<{ time: number; value: number }>>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_ENDPOINT, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      const timestamp = Date.now();

      const newData: ESP8266Data = {
        current: jsonData.current || 0,
        voltage: jsonData.voltage || 0,
        load: jsonData.load || false,
        overcurrent: jsonData.overcurrent || false,
        uptime: jsonData.uptime || 0,
        temperature: jsonData.temperature || 0,
        timestamp,
      };

      setData(newData);
      setIsConnected(true);
      setIsError(false);
      setError(null);
      setIsLoading(false);

      // Update current history
      setCurrentHistory((prev) => {
        const newHistory = [
          ...prev,
          { time: timestamp, value: newData.current },
        ];
        // Keep only the last MAX_HISTORY_LENGTH entries
        return newHistory.slice(-MAX_HISTORY_LENGTH);
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }

      setIsError(true);
      setIsConnected(false);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    isConnected,
    currentHistory,
  };
}
