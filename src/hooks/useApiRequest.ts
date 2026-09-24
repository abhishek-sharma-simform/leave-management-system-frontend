import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

type ApiRequestResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** Re-runs the same request — used by retry buttons and after mutations. */
  reload: () => void;
};

/**
 * Runs `fetcher` and tracks its result. `fetcher` must be a `useCallback` whose
 * dependencies are the query's inputs: a new identity means new inputs, which
 * is what triggers a refetch. It receives an `AbortSignal` that it must pass
 * down to the underlying request, so a superseded call (a fast filter change,
 * or StrictMode's dev-only double-invoke of this effect) aborts the in-flight
 * HTTP request instead of just letting it complete and discarding the result —
 * that's what keeps each state change to a single real network call.
 *
 * `isLoading` is *derived* by comparing the fetcher that produced the current
 * result against the current one, rather than being flipped by the effect.
 * That keeps the effect free of synchronous state updates (which React's
 * compiler lint rejects, since they cause a cascading second render) while
 * still showing a loading state the moment the inputs change.
 */
export function useApiRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
): ApiRequestResult<T> {
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    source: (signal: AbortSignal) => Promise<T>;
    token: number;
    data: T | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ source: fetcher, token: reloadToken, data, error: null });
        }
      })
      .catch((caught) => {
        if (!controller.signal.aborted) {
          setResult({
            source: fetcher,
            token: reloadToken,
            data: null,
            error: getErrorMessage(caught),
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [fetcher, reloadToken]);

  const isCurrent = result?.source === fetcher && result.token === reloadToken;

  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    isLoading: !isCurrent,
    reload: useCallback(() => setReloadToken((token) => token + 1), []),
  };
}
