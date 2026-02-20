import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data: any;
  created_at: string;
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { playNewRequestSound, playAcceptedSound, playGenericSound } = useNotificationSound();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    // Cleanup any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create unique channel name with timestamp to avoid conflicts
    const channelName = `notifications-rt-${user.id}-${Date.now()}`;
    console.log("🔔 Setting up notification channel:", channelName);
    
    const channel = supabase.channel(channelName);
    
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔔 New notification received:", payload);
          const newNotification = payload.new as Notification;
          
          // Play appropriate sound based on notification type and user role
          const notificationType = newNotification.type;
          if (profile?.role === "technician" && notificationType === "service_request") {
            // New service request for technician
            playNewRequestSound();
          } else if (profile?.role === "client" && notificationType === "service_accepted") {
            // Service accepted for client
            playAcceptedSound();
          } else {
            // Generic notification
            playGenericSound();
          }
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📝 Notification updated:", payload);
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      );

    // Subscribe and handle status
    channel.subscribe((status, err) => {
      console.log(`📡 Notification channel status: ${status}`, err || "");
      if (status === "SUBSCRIBED") {
        console.log("✅ Notification channel subscribed successfully");
      }
      if (status === "CHANNEL_ERROR") {
        console.error("❌ Notification channel error:", err);
      }
    });

    channelRef.current = channel;

    return () => {
      console.log("🔌 Cleaning up notification channel:", channelName);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, profile?.role, toast, queryClient, playNewRequestSound, playAcceptedSound, playGenericSound]);

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
