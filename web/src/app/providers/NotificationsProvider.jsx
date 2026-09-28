import { createContext, useCallback, useContext, useMemo } from "react";
import { useAsyncData } from "../hooks/useAsyncDataHook";
import { notificationService } from "../services/notificationService";
import { mapNotification } from "../utils/adapters";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { data, setData, loading, error, reload } = useAsyncData(
    useCallback(async () => {
      const result = await notificationService.listMine();
      return Array.isArray(result) ? result.map(mapNotification) : [];
    }, []),
    [],
    { initialData: [] },
  );
  const setNotifications = useCallback(
    (updater) => setData(updater),
    [setData],
  );
  const value = useMemo(
    () => ({
      notifications: Array.isArray(data) ? data : [],
      setNotifications,
      loading,
      error,
      reload,
    }),
    [data, setNotifications, loading, error, reload],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de NotificationsProvider.");
  }
  return context;
}
