import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { VendorChatDialog } from "@/components/chat/VendorChatDialog";
import { cn } from "@/lib/utils";

interface Conversation {
  client_id: string;
  client_name: string;
  client_avatar?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function VendorMessagesTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading, refetch } = useQuery({
    queryKey: ["vendor-conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all messages where this user is the vendor
      const { data: messages, error } = await supabase
        .from("vendor_chat_messages")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      // Group by client_id
      const clientMap = new Map<string, { lastMsg: typeof messages[0]; unread: number }>();
      messages.forEach((msg) => {
        const existing = clientMap.get(msg.client_id);
        if (!existing) {
          clientMap.set(msg.client_id, {
            lastMsg: msg,
            unread: (!msg.read && msg.sender_id !== user.id) ? 1 : 0,
          });
        } else {
          if (!msg.read && msg.sender_id !== user.id) {
            existing.unread += 1;
          }
        }
      });

      // Fetch client profiles
      const clientIds = Array.from(clientMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", clientIds);

      const convos: Conversation[] = clientIds.map((clientId) => {
        const entry = clientMap.get(clientId)!;
        const profile = profiles?.find((p) => p.user_id === clientId);
        return {
          client_id: clientId,
          client_name: profile?.name || "Cliente",
          client_avatar: profile?.avatar_url || undefined,
          last_message: entry.lastMsg.message,
          last_message_at: entry.lastMsg.created_at,
          unread_count: entry.unread,
        };
      });

      // Sort by last message time
      convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      return convos;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`vendor-inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vendor_chat_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.vendor_id === user.id) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const filtered = useMemo(
    () =>
      search.trim()
        ? conversations.filter((c) =>
            c.client_name.toLowerCase().includes(search.toLowerCase())
          )
        : conversations,
    [conversations, search]
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}m`;
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h`;
    if (diffHrs < 48) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mensagens</h1>
            <p className="text-sm text-muted-foreground">
              {totalUnread > 0
                ? `${totalUnread} mensagem(ns) não lida(s)`
                : "Suas conversas com clientes"}
            </p>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-sm px-3 py-1">
              {totalUnread}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-secondary/50 border-border"
          />
        </div>
      </motion.div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">
            {search ? "Nenhuma conversa encontrada" : "Nenhuma mensagem ainda"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Tente outro termo de pesquisa"
              : "Quando clientes enviarem mensagens, aparecerão aqui"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((convo, i) => (
              <motion.button
                key={convo.client_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedChat(convo)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                  convo.unread_count > 0
                    ? "bg-primary/5 border border-primary/10"
                    : "bg-card border border-border/50 hover:bg-secondary/50"
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    {convo.client_avatar && <AvatarImage src={convo.client_avatar} />}
                    <AvatarFallback className="bg-secondary text-foreground font-semibold">
                      {convo.client_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {convo.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {convo.unread_count > 9 ? "9+" : convo.unread_count}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-sm truncate",
                        convo.unread_count > 0
                          ? "font-bold text-foreground"
                          : "font-medium text-foreground"
                      )}
                    >
                      {convo.client_name}
                    </p>
                    <span
                      className={cn(
                        "text-[11px] flex-shrink-0 ml-2",
                        convo.unread_count > 0
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatTime(convo.last_message_at)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate mt-0.5",
                      convo.unread_count > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {convo.last_message}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Chat Dialog */}
      {selectedChat && user && (
        <VendorChatDialog
          open={!!selectedChat}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedChat(null);
              refetch();
            }
          }}
          vendorUserId={user.id}
          clientUserId={selectedChat.client_id}
          otherUserName={selectedChat.client_name}
          otherUserAvatar={selectedChat.client_avatar}
        />
      )}
    </div>
  );
}
