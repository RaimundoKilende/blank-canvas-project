import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatDialog } from "./ChatDialog";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
  serviceRequestId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  variant?: "default" | "icon";
  className?: string;
}

export function ChatButton({
  serviceRequestId,
  otherUserName,
  otherUserAvatar,
  variant = "default",
  className,
}: ChatButtonProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useChat(serviceRequestId);

  return (
    <>
      <Button
        variant={variant === "icon" ? "outline" : "default"}
        size={variant === "icon" ? "icon" : "sm"}
        onClick={() => setOpen(true)}
        className={cn(
          "relative",
          variant === "default" && "gradient-primary text-primary-foreground",
          className
        )}
      >
        <MessageCircle className={cn("w-4 h-4", variant === "default" && "mr-2")} />
        {variant === "default" && "Chat"}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <ChatDialog
        open={open}
        onOpenChange={setOpen}
        serviceRequestId={serviceRequestId}
        otherUserName={otherUserName}
        otherUserAvatar={otherUserAvatar}
      />
    </>
  );
}
