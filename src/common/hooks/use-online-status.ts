import { useSyncExternalStore } from "react";

const CONNECTION_EVENTS = ["online", "offline"] as const;

function subscribeToConnectionChange(callback: () => void): () => void {
  CONNECTION_EVENTS.forEach((event) => window.addEventListener(event, callback));

  return () => {
    CONNECTION_EVENTS.forEach((event) => window.removeEventListener(event, callback));
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeToConnectionChange,
    () => navigator.onLine,
    () => true,
  );
}
