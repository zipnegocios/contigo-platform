/**
 * Shared Server-Sent Events (SSE) helper for real-time routes.
 *
 * This module builds a polling-based SSE stream: it periodically fetches a
 * snapshot of data, compares it against the last snapshot sent to the
 * client using a caller-supplied predicate, and pushes a `data:` event only
 * when something actually changed. It also sends periodic heartbeat
 * comments to keep intermediary proxies from timing out the connection,
 * and tears down cleanly when the client disconnects.
 *
 * Auth/token-resolution is NOT this helper's concern — every concrete route
 * must authenticate/authorize the request *before* calling this helper.
 *
 * Route files that use this helper must additionally export
 * `export const dynamic = 'force-dynamic'` themselves — that route-level
 * export is intentionally NOT part of this shared helper.
 */

const DEFAULT_INTERVAL_MS = 2500;
const HEARTBEAT_INTERVAL_MS = 15000;

export interface SSEStreamOptions<T> {
  /** Polling interval in milliseconds. Defaults to 2500ms. */
  intervalMs?: number;
  /**
   * Fetches the current snapshot of data to compare/send. Receives the same
   * AbortSignal as the incoming request, so callers may (optionally) pass it
   * through to abort in-flight DB queries on client disconnect.
   */
  fetchSnapshot: (signal: AbortSignal) => Promise<T>;
  /**
   * Decides whether `next` differs meaningfully from `prev` and should be
   * sent to the client. `prev` is `null` on the very first tick — but note
   * the very first snapshot is ALWAYS sent regardless of what this predicate
   * returns; `hasChanged` only gates every tick after the first.
   */
  hasChanged: (prev: T | null, next: T) => boolean;
  /** Serializes a snapshot into the string payload for the SSE `data:` field. */
  serialize: (data: T) => string;
}

/**
 * Creates a `Response` wrapping a `ReadableStream` that emits Server-Sent
 * Events for the given options, tied to the lifecycle of `request`.
 */
export function createSSEStream<T>(
  request: Request,
  options: SSEStreamOptions<T>,
): Response {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const { fetchSnapshot, hasChanged, serialize } = options;
  const signal = request.signal;

  const encoder = new TextEncoder();

  let lastSent: T | null = null;
  let ticksSinceHeartbeat = 0;
  // Roughly every 6th tick at the default 2500ms interval == ~15s.
  const ticksPerHeartbeat = Math.max(1, Math.round(HEARTBEAT_INTERVAL_MS / intervalMs));

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let intervalId: ReturnType<typeof setInterval> | undefined;

      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (intervalId !== undefined) {
          clearInterval(intervalId);
          intervalId = undefined;
        }
        try {
          controller.close();
        } catch {
          // Controller may already be closed/errored; ignore.
        }
      };

      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Enqueue can throw if the controller was closed concurrently
          // (e.g. abort fired mid-tick); treat as a disconnect.
          safeClose();
        }
      };

      const sendSnapshot = (data: T) => {
        enqueue(`data: ${serialize(data)}\n\n`);
        lastSent = data;
      };

      const tick = async () => {
        if (closed) return;

        try {
          const next = await fetchSnapshot(signal);
          if (closed) return;

          if (lastSent === null || hasChanged(lastSent, next)) {
            sendSnapshot(next);
          }
        } catch (error) {
          // Never let one bad tick crash/close the whole connection.
          console.error('[createSSEStream] fetchSnapshot tick failed:', error);
        }

        if (closed) return;

        ticksSinceHeartbeat += 1;
        if (ticksSinceHeartbeat >= ticksPerHeartbeat) {
          ticksSinceHeartbeat = 0;
          enqueue(': heartbeat\n\n');
        }
      };

      // Send the initial snapshot immediately on connect, unconditionally
      // (never gated by hasChanged — that predicate only applies to
      // subsequent ticks).
      void (async () => {
        try {
          const initial = await fetchSnapshot(signal);
          if (closed) return;
          sendSnapshot(initial);
        } catch (error) {
          console.error('[createSSEStream] initial fetchSnapshot failed:', error);
        }

        if (closed) return;
        intervalId = setInterval(() => {
          void tick();
        }, intervalMs);
      })();

      const onAbort = () => {
        safeClose();
      };

      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
