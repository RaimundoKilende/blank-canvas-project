import { useState } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TechnicianCommentsSectionProps {
  technicianUserId: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  author_id: string;
  author?: { name: string; avatar_url: string | null };
}

export function TechnicianCommentsSection({ technicianUserId }: TechnicianCommentsSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["technician-comments", technicianUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technician_comments")
        .select("*")
        .eq("technician_user_id", technicianUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set(data.map((c: any) => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((c: any) => ({
        ...c,
        author: profileMap.get(c.author_id) || { name: "Usuário", avatar_url: null },
      })) as Comment[];
    },
    enabled: !!technicianUserId,
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      const { error } = await supabase.from("technician_comments").insert({
        technician_user_id: technicianUserId,
        author_id: user!.id,
        comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["technician-comments", technicianUserId] });
      toast({ title: "Comentário adicionado!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar comentário", variant: "destructive" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("technician_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-comments", technicianUserId] });
    },
  });

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed || !user) return;
    addComment.mutate(trimmed);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">
          Comentários ({comments.length})
        </h3>
      </div>

      {/* Add comment form */}
      {user && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            maxLength={500}
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 p-2.5 rounded-xl bg-secondary/30">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={c.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {c.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground truncate">
                    {c.author?.name || "Usuário"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    {user?.id === c.author_id && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
