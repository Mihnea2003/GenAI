"use client";

import { useEffect, useEffectEvent, useState } from "react";

type Result<T> = { key: string; baseKey: string; data?: T; error?: unknown };

/**
 * Loads data for `key` (null = don't load) and exposes loading / error / reload.
 * After `reload()`, the previous data stays visible until the new data arrives (no flicker).
 * With `keepPrevious`, data from a different key (e.g. the previous search) stays visible too.
 */
export function useAsyncData<T>(key: string | null, load: () => Promise<T>, options: { keepPrevious?: boolean } = {}) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const fullKey = key === null ? null : `${key}#${version}`;
  const runLoad = useEffectEvent(() => load());

  useEffect(() => {
    if (key === null || fullKey === null) return;
    let active = true;
    runLoad().then(
      (data) => active && setResult({ key: fullKey, baseKey: key, data }),
      (error: unknown) => active && setResult({ key: fullKey, baseKey: key, error }),
    );
    return () => {
      active = false;
    };
  }, [key, fullKey]);

  const current = result?.key === fullKey ? result : null;
  const stale = key !== null && (options.keepPrevious || result?.baseKey === key) ? result : null;
  return {
    data: (current ?? stale)?.data,
    error: current?.error,
    loading: fullKey !== null && current === null,
    reload: () => setVersion((v) => v + 1),
  };
}
