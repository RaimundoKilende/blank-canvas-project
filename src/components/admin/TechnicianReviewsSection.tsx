import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, Calendar, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TechnicianReviewsSectionProps {
  technicianUserId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client?: {
    name: string;
    avatar_url: string | null;
  };
}

export function TechnicianReviewsSection({ technicianUserId }: TechnicianReviewsSectionProps) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["technician-reviews", technicianUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("technician_id", technicianUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get client profiles
      const clientIds = [...new Set(data.map((r) => r.client_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", clientIds);

      return data.map((review) => ({
        ...review,
        client: profiles?.find((p) => p.user_id === review.client_id),
      })) as Review[];
    },
    enabled: !!technicianUserId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Nenhuma avaliação ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        Avaliações ({reviews.length})
      </h4>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {reviews.map((review) => (
          <div key={review.id} className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {review.client?.name?.split(" ").map((n) => n[0]).join("") || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-foreground">
                    {review.client?.name || "Cliente"}
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? "text-primary fill-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(review.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
