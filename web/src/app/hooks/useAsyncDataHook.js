import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook customizado para lidar com chamadas assíncronas (GET).
 * Mantém dados anteriores durante reload para evitar piscada de skeleton.
 */
export function useAsyncData(loader, dependencies = [], options = {}) {
  const { immediate = true, initialData = null, keepPreviousData = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate && initialData == null);
  const [error, setError] = useState(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const reload = useCallback(async () => {
    if (!keepPreviousData || dataRef.current == null) setLoading(true);
    setError(null);

    try {
      const result = await loader();
      const safeResult = result ?? initialData;
      setData(safeResult);
      return safeResult;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) reload().catch(() => {});
  }, [immediate, reload]);

  return { data, setData, loading, error, reload };
}
