import { useCallback, useEffect, useState } from "react";

/**
 * Hook customizado para lidar com chamadas assíncronas (GET)
 */
export function useAsyncData(loader, dependencies = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
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
    if (immediate) {
      reload().catch(() => {});
    }
  }, [immediate, reload]);

  return { data, setData, loading, error, reload };
}