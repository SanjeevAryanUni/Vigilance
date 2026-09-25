'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiBase } from '@/lib/api';
import { WebSocketMessage } from '@/types/vigilance';

export function useWebSocket(onMessage?: (msg: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const onMessageRef = useRef(onMessage);
  const backoffRef = useRef(1000); // Start at 1s

  // Keep latest onMessage reference without triggering reconnection
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Avoid duplicate connection if already open or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const base = getApiBase();
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (base ? base.replace(/^http/, 'ws') + '/ws' : '') ||
      (window.location.hostname === 'localhost' ? 'ws://localhost:8000/ws' : '');

    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        backoffRef.current = 1000; // Reset backoff on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          let message: WebSocketMessage | null = null;

          if (parsed.type === 'new_detection' || parsed.event === 'NEW_DETECTION') {
            message = {
              type: 'new_detection',
              data: parsed.data,
            };
          } else if (parsed.type === 'stats_update' || parsed.event === 'STATS_UPDATE') {
            message = {
              type: 'stats_update',
              data: parsed.data,
            };
          } else if (parsed.type === 'cluster_updated' || parsed.event === 'CLUSTER_UPDATED') {
            message = {
              type: 'cluster_updated',
              data: parsed.data,
            };
          } else if (parsed.type === 'clusters_reset' || parsed.event === 'CLUSTERS_RESET') {
            message = {
              type: 'clusters_reset',
              data: parsed.data,
            };
          }

          if (message) {
            setLastMessage(message);
            onMessageRef.current?.(message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        const delay = backoffRef.current;
        backoffRef.current = Math.min(delay * 1.5, 30000); // Exponential backoff up to 30s
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      setIsConnected(false);
      const delay = backoffRef.current;
      backoffRef.current = Math.min(delay * 1.5, 30000);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
