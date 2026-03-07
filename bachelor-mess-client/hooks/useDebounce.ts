import { useCallback, useEffect, useRef } from 'react';
import { config } from '@/config';

/**
 * Centralized throttle: runs the callback at most once per `delayMs`.
 * - Without getKey: global throttle (any call within delayMs is ignored).
 * - With getKey: throttle per key (e.g. per item id), so different keys can fire within delayMs.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
  getKey?: (...args: Parameters<T>) => string
): T {
  const last = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const fnRef = useRef(fn);
  const getKeyRef = useRef(getKey);
  fnRef.current = fn;
  getKeyRef.current = getKey;

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const keyGetter = getKeyRef.current;
      const key = keyGetter ? keyGetter(...args) : '';
      const { key: prevKey, at } = last.current;
      if (key === prevKey && now - at < delayMs) return;
      last.current = { key, at: now };
      return fnRef.current(...args);
    }) as T,
    [delayMs]
  ) as T;
}

/**
 * Centralized debounce: runs the callback only after no calls for `delayMs`.
 * Use for search input, resize, etc. Cleans up pending timeout on unmount.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...args);
      }, delayMs);
    }) as T,
    [delayMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, []);

  return debounced;
}

/** Default delay for press/click throttle (avoids double-tap). From config. */
export const PRESS_THROTTLE_MS = config.pressThrottleMs;
