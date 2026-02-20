import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Delivery {
  id: string;
  order_id: string;
  vendor_id: string;
  delivery_person_id: string | null;
  status: string;
  pickup_address: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  order?: any;
}

export function useDeliveries(role: "vendor" | "delivery" = "delivery") {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["deliveries", role, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, order:orders(*, items:order_items(*, product:products(name)))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Delivery[];
    },
    enabled: !!user,
  });

  // Realtime subscription for delivery tracking
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("deliveries-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const createDelivery = useMutation({
    mutationFn: async (delivery: Partial<Delivery> & { order_id: string; vendor_id: string }) => {
      const { data, error } = await supabase.from("deliveries").insert(delivery).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast({ title: "Entrega solicitada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const acceptDelivery = useMutation({
    mutationFn: async (deliveryId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("deliveries")
        .update({ delivery_person_id: user.id, status: "accepted" })
        .eq("id", deliveryId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast({ title: "Entrega aceite!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, status, ...rest }: { id: string; status: string; [key: string]: any }) => {
      const updates: any = { status, ...rest };
      if (status === "picked_up") updates.picked_up_at = new Date().toISOString();
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      const { data, error } = await supabase.from("deliveries").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast({ title: "Estado atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, lat, lng }: { id: string; lat: number; lng: number }) => {
      const { error } = await supabase
        .from("deliveries")
        .update({ current_latitude: lat, current_longitude: lng })
        .eq("id", id);
      if (error) throw error;
    },
  });

  const pendingDeliveries = deliveries.filter(d => d.status === "pending" && !d.delivery_person_id);
  const activeDeliveries = deliveries.filter(d => ["accepted", "picked_up", "in_transit"].includes(d.status));
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");

  return {
    deliveries,
    pendingDeliveries,
    activeDeliveries,
    completedDeliveries,
    isLoading,
    createDelivery,
    acceptDelivery,
    updateDeliveryStatus,
    updateLocation,
  };
}
