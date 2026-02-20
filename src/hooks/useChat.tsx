import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  service_request_id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    name: string;
    avatar_url?: string;
  };
}

export function useChat(serviceRequestId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch messages for a service request
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ["chat-messages", serviceRequestId],
    queryFn: async () => {
      if (!serviceRequestId) return [];

      const { data: messagesData, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("service_request_id", serviceRequestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!messagesData || messagesData.length === 0) return [];

      // Get sender profiles
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", senderIds);

      return messagesData.map(msg => ({
        ...msg,
        sender: profiles?.find(p => p.user_id === msg.sender_id)
      })) as ChatMessage[];
    },
    enabled: !!serviceRequestId && !!user,
    refetchInterval: false,
    staleTime: 0,
  });

  // Real-time subscription with improved handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!serviceRequestId || !user) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Use a stable channel name (not time-based) to prevent multiple subscriptions
    const channelName = `chat-messages-${serviceRequestId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `service_request_id=eq.${serviceRequestId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Skip if this message was sent by current user (already added optimistically)
          if (newMessage.sender_id === user.id) {
            // Just update to replace temp ID with real ID
            queryClient.setQueryData<ChatMessage[]>(
              ["chat-messages", serviceRequestId],
              (oldMessages = []) => {
                // Check if we already have this message
                const exists = oldMessages.some(m => m.id === newMessage.id);
                if (exists) return oldMessages;
                
                // Remove temp message and add real one
                const filtered = oldMessages.filter(m => !m.id.startsWith('temp-'));
                return [...filtered, { ...newMessage, sender: undefined }];
              }
            );
            return;
          }
          
          // For messages from others, fetch sender profile and add immediately
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("user_id, name, avatar_url")
            .eq("user_id", newMessage.sender_id)
            .single();

          const messageWithSender: ChatMessage = {
            ...newMessage,
            sender: senderProfile || undefined,
          };

          // Update cache immediately - this makes messages appear instantly
          queryClient.setQueryData<ChatMessage[]>(
            ["chat-messages", serviceRequestId],
            (oldMessages = []) => {
              // Avoid duplicates
              if (oldMessages.some(m => m.id === messageWithSender.id)) {
                return oldMessages;
              }
              return [...oldMessages, messageWithSender];
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `service_request_id=eq.${serviceRequestId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          queryClient.setQueryData<ChatMessage[]>(
            ["chat-messages", serviceRequestId],
            (oldMessages = []) => 
              oldMessages.map(m => 
                m.id === updatedMessage.id 
                  ? { ...m, ...updatedMessage } 
                  : m
              )
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Chat realtime subscription active for:", serviceRequestId);
        } else if (status === "CHANNEL_ERROR") {
          console.error("Chat realtime subscription error, retrying...");
          // Retry subscription after a delay
          setTimeout(() => setupRealtimeSubscription(), 2000);
        }
      });

    channelRef.current = channel;
  }, [serviceRequestId, user, queryClient]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [setupRealtimeSubscription]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user || !serviceRequestId) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          service_request_id: serviceRequestId,
          sender_id: user.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update for instant feedback
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: ["chat-messages", serviceRequestId] });

      const previousMessages = queryClient.getQueryData<ChatMessage[]>(["chat-messages", serviceRequestId]);

      // Optimistically add the message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        service_request_id: serviceRequestId!,
        sender_id: user!.id,
        message,
        read: false,
        created_at: new Date().toISOString(),
        sender: undefined,
      };

      queryClient.setQueryData<ChatMessage[]>(
        ["chat-messages", serviceRequestId],
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, message, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["chat-messages", serviceRequestId], context.previousMessages);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["chat-messages", serviceRequestId] });
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !serviceRequestId) return;

      await supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("service_request_id", serviceRequestId)
        .neq("sender_id", user.id);
    },
  });

  // Count unread messages
  const unreadCount = messages.filter(m => !m.read && m.sender_id !== user?.id).length;

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    unreadCount,
    refetch,
  };
}
