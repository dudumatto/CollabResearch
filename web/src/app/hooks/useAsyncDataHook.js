import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook customizado para lidar com chamadas assíncronas (GET)
 */
export function useAsyncData(loader, dependencies = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async ({ signal } = {}) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await loader({ signal });
      const safeResult = result ?? initialData;
      if (requestId === requestIdRef.current && !signal?.aborted) {
        setData(safeResult);
      }
      return safeResult;
    } catch (err) {
      if (requestId === requestIdRef.current && !signal?.aborted && err?.name !== "AbortError") {
        setError(err);
      }
      throw err;
    } finally {
      if (requestId === requestIdRef.current && !signal?.aborted) {
        setLoading(false);
      }
    }
  }, dependencies);

  useEffect(() => {
    if (!immediate) return undefined;
    const controller = new AbortController();
    reload({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [immediate, reload]);

  return { data, setData, loading, error, reload };
}
