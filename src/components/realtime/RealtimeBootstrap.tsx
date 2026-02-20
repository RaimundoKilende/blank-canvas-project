import { useNotifications } from "@/hooks/useNotifications";
import { useServiceRequestsRealtime } from "@/hooks/useServiceRequestsRealtime";

/**
 * Componente “sem UI” para garantir que subscrições em tempo real
 * fiquem ativas mesmo trocando de tab.
 */
export function RealtimeBootstrap() {
  useNotifications();
  useServiceRequestsRealtime();
  return null;
}
