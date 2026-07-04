'use client';

import { useEffect, useRef } from 'react';

/**
 * Subscribes to a Server-Sent Events (SSE) stream and invokes `onMessage`
 * with the parsed JSON payload of each incoming `message` event.
 *
 * Pairs with `src/infrastructure/realtime/createSSEStream.ts`, which emits
 * `data: <json>\n\n` events plus periodic `: heartbeat\n\n` comment lines.
 * Native `EventSource` does not fire any event for comment lines, so
 * heartbeats require no handling here — they exist purely to keep the
 * connection alive through proxies.
 *
 * - Pass `url: null` to intentionally stay disconnected (and to stay
 *   SSR-safe, since `EventSource` is a browser-only global). Any existing
 *   connection is closed when `url` becomes `null`.
 * - The `EventSource` is recreated only when `url` changes — `onMessage`/
 *   `onError` are read from refs on every event, so passing new inline
 *   function identities on every render does NOT tear down/reconnect the
 *   stream.
 * - Relies entirely on `EventSource`'s built-in auto-reconnect on error; no
 *   manual reconnect/backoff logic is implemented here.
 */
export function useSSE<T>(
  url: string | null,
  onMessage: (data: T) => void,
  options?: { onError?: () => void },
): void {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(options?.onError);

  // Keep the refs current every render. Plain assignment during render (no
  // effect needed) so the connect/disconnect effect below never needs these
  // in its dependency array.
  onMessageRef.current = onMessage;
  onErrorRef.current = options?.onError;

  useEffect(() => {
    if (!url) {
      return;
    }

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        onMessageRef.current(parsed);
      } catch (error) {
        console.error('[useSSE] Failed to parse SSE message payload:', error);
      }
    };

    eventSource.onerror = () => {
      try {
        onErrorRef.current?.();
      } catch (error) {
        console.error('[useSSE] onError callback threw:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [url]);
}
