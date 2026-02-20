import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequestId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

export function ChatDialog({
  open,
  onOpenChange,
  serviceRequestId,
  otherUserName,
  otherUserAvatar,
}: ChatDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useChat(serviceRequestId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when opening
  useEffect(() => {
    if (open) {
      markAsRead.mutate();
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage.mutateAsync(newMessage.trim());
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hoje";
    if (d.toDateString() === yesterday.toDateString()) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const existing = groupedMessages.find((g) => g.date === date);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-border"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              {otherUserAvatar && <AvatarImage src={otherUserAvatar} />}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {otherUserName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-foreground text-left">
                {otherUserName}
              </SheetTitle>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Online
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Inicie a conversa enviando uma mensagem
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date Separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium px-2">
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    {group.messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user?.id;
                      const showAvatar = 
                        index === 0 || 
                        group.messages[index - 1].sender_id !== msg.sender_id;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex items-end gap-2",
                            isOwn ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {!isOwn && showAvatar ? (
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-xs bg-secondary">
                                {msg.sender?.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-7" />
                          )}
                          
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card border border-border rounded-bl-md"
                            )}
                          >
                            <p className="text-sm leading-relaxed break-words">
                              {msg.message}
                            </p>
                            <p
                              className={cn(
                                "text-[10px] mt-1",
                                isOwn
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Compact for mobile */}
        <div className="p-3 border-t border-border bg-card/50">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10 text-sm bg-background border-border focus-visible:ring-primary rounded-full px-4"
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
              className="gradient-primary text-primary-foreground shrink-0 w-10 h-10 rounded-full"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
