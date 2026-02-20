import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Mantém a UI sincronizada em tempo real com alterações em `service_requests`.
 * Separado do `useServiceRequests()` para:
 * - Evitar múltiplas subscrições quando vários componentes usam o hook.
 * - Permitir montar a subscrição num nível mais alto (dashboard) com melhor estabilidade.
 */
export function useServiceRequestsRealtime() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const setup = useCallback(() => {
    if (!user || !profile) return;

    cleanup();

    // Nome estável: reduz churn e facilita depuração.
    const channelName = `service-requests-rt-${profile.role}-${user.id}`;
    const channel = supabase.channel(channelName);

    // Filtros por perfil para reduzir volume de eventos (melhor desempenho).
    const baseFilter =
      profile.role === "client"
        ? `client_id=eq.${user.id}`
        : undefined;

    // INSERT
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "service_requests",
        ...(baseFilter ? { filter: baseFilter } : {}),
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      }
    );

    // UPDATE
    // Para técnicos, é útil receber updates apenas dos seus serviços; para clientes, dos seus.
    const updateFilter =
      profile.role === "technician"
        ? `technician_id=eq.${user.id}`
        : profile.role === "client"
          ? `client_id=eq.${user.id}`
          : undefined;

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "service_requests",
        ...(updateFilter ? { filter: updateFilter } : {}),
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      }
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // ok
        return;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Retentativa simples — evita ficar "travado" sem realtime.
        retryTimerRef.current = window.setTimeout(() => setup(), 2000);
      }
    });

    channelRef.current = channel;
  }, [cleanup, profile, queryClient, user]);

  useEffect(() => {
    if (!user || !profile) return;

    setup();
    return cleanup;
  }, [cleanup, profile, setup, user]);
}
