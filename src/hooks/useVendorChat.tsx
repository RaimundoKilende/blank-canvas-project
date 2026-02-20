import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useCallback } from "react";

export interface VendorChatMessage {
  id: string;
  vendor_id: string;
  client_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    name: string;
    avatar_url?: string;
  };
}

export function useVendorChat(vendorId: string | null, clientId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const chatKey = ["vendor-chat", vendorId, clientId];

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: chatKey,
    queryFn: async () => {
      if (!vendorId || !clientId) return [];

      const { data, error } = await supabase
        .from("vendor_chat_messages")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", senderIds);

      return data.map(msg => ({
        ...msg,
        read: msg.read ?? false,
        sender: profiles?.find(p => p.user_id === msg.sender_id),
      })) as VendorChatMessage[];
    },
    enabled: !!vendorId && !!clientId && !!user,
    staleTime: 0,
  });

  const setupRealtime = useCallback(() => {
    if (!vendorId || !clientId || !user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`vendor-chat-${vendorId}-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vendor_chat_messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.vendor_id !== vendorId || newMsg.client_id !== clientId) return;

          if (newMsg.sender_id === user.id) {
            queryClient.setQueryData<VendorChatMessage[]>(chatKey, (old = []) => {
              if (old.some(m => m.id === newMsg.id)) return old;
              return [...old.filter(m => !m.id.startsWith("temp-")), { ...newMsg, read: newMsg.read ?? false }];
            });
            return;
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .eq("user_id", newMsg.sender_id)
            .single();

          queryClient.setQueryData<VendorChatMessage[]>(chatKey, (old = []) => {
            if (old.some(m => m.id === newMsg.id)) return old;
            return [...old, { ...newMsg, read: newMsg.read ?? false, sender: profile || undefined }];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [vendorId, clientId, user, queryClient]);

  useEffect(() => {
    setupRealtime();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupRealtime]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !vendorId || !clientId) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("vendor_chat_messages")
        .insert({
          vendor_id: vendorId,
          client_id: clientId,
          sender_id: user.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: chatKey });
      const prev = queryClient.getQueryData<VendorChatMessage[]>(chatKey);

      queryClient.setQueryData<VendorChatMessage[]>(chatKey, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          vendor_id: vendorId!,
          client_id: clientId!,
          sender_id: user!.id,
          message,
          read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      return { prev };
    },
    onError: (_err, _msg, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(chatKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !vendorId || !clientId) return;
      await supabase
        .from("vendor_chat_messages")
        .update({ read: true })
        .eq("vendor_id", vendorId)
        .eq("client_id", clientId)
        .neq("sender_id", user.id);
    },
  });

  const unreadCount = messages.filter(m => !m.read && m.sender_id !== user?.id).length;

  return { messages, isLoading, sendMessage, markAsRead, unreadCount, refetch };
}
