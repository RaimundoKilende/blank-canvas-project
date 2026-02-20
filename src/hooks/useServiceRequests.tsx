import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface ServiceRequest {
  id: string;
  client_id: string;
  technician_id: string | null;
  category_id: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  base_price: number;
  extras: any[];
  total_price: number;
  urgency: string | null;
  photos: string[] | null;
  rating: number | null;
  feedback: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  quote_amount: number | null;
  quote_description: string | null;
  quote_status: "sent" | "approved" | "rejected" | null;
  quote_sent_at: string | null;
  quote_approved_at: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    base_price: number;
  };
  service?: {
    id: string;
    name: string;
    description: string | null;
  };
  client?: {
    name: string;
    email: string;
    phone: string | null;
    avatar_url?: string | null;
  };
  technician?: {
    name: string;
    email: string;
    phone: string | null;
    avatar_url?: string | null;
  };
}

interface CreateServiceRequestInput {
  category_id: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  urgency?: string;
  photos?: string[];
  audio_url?: string;
  technician_id?: string;
  scheduling_type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
}

export function useServiceRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch service requests based on user role
  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ["service-requests", profile?.role, user?.id],
    queryFn: async () => {
      if (!user || !profile) return [];

      // Build query
      let query = supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter based on role
      if (profile.role === "client" || profile.role === "vendor") {
        query = query.eq("client_id", user.id);
      } else if (profile.role === "technician") {
        // Technicians see:
        // 1. Broadcast pending requests (technician_id is null AND status is pending)
        // 2. Direct pending requests to them (technician_id equals their id AND status is pending)
        // 3. Any request assigned to them (technician_id equals their id, regardless of status)
        query = query.or(`and(status.eq.pending,technician_id.is.null),technician_id.eq.${user.id}`);
      }
      // Admins see all requests (RLS handles this)

      const { data: requestsData, error: reqError } = await query;

      if (reqError) throw reqError;
      if (!requestsData || requestsData.length === 0) return [];

      // Get unique category IDs
      const categoryIds = [...new Set(requestsData.map((r) => r.category_id))];

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("service_categories")
        .select("id, name, icon, base_price")
        .in("id", categoryIds);

      // Fetch services linked to these categories (for service name)
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, description, category_id")
        .in("category_id", categoryIds)
        .eq("active", true);

      // Get unique client IDs
      const clientIds = [...new Set(requestsData.map((r) => r.client_id))];
      
      // Fetch client profiles
      const { data: clientProfiles } = await supabase
        .from("profiles")
        .select("user_id, name, email, phone, avatar_url")
        .in("user_id", clientIds);

      // Get unique technician IDs
      const technicianIds = [...new Set(requestsData.map((r) => r.technician_id).filter(Boolean))];
      
      // Fetch technician profiles
      const { data: technicianProfiles } = technicianIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("user_id, name, email, phone, avatar_url")
            .in("user_id", technicianIds)
        : { data: [] };

      // Map categories, clients, technicians and services to requests
      return requestsData.map((request) => {
        const category = categoriesData?.find((c) => c.id === request.category_id);
        // Find the first active service for this category
        const service = servicesData?.find((s) => s.category_id === request.category_id);
        return {
          ...request,
          category,
          service: service ? { id: service.id, name: service.name, description: service.description } : undefined,
          client: clientProfiles?.find((p) => p.user_id === request.client_id),
          technician: technicianProfiles?.find((p) => p.user_id === request.technician_id),
        };
      }) as ServiceRequest[];
    },
    enabled: !!user && !!profile,
  });

  // Realtime foi movido para `useServiceRequestsRealtime()`.
  // Isso evita múltiplas subscrições e melhora a estabilidade entre tabs.

  // Create a new service request
  const createRequest = useMutation({
    mutationFn: async (input: CreateServiceRequestInput) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Get category base price
      const { data: category, error: catError } = await supabase
        .from("service_categories")
        .select("base_price")
        .eq("id", input.category_id)
        .single();

      if (catError) throw catError;

      const basePrice = category.base_price;
      const urgencyMultiplier = input.urgency === "urgent" ? 1.2 : 1;
      const totalPrice = basePrice * urgencyMultiplier;

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: user.id,
          category_id: input.category_id,
          description: input.description,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          urgency: input.urgency || "normal",
          photos: input.photos || [],
          audio_url: input.audio_url || null,
          base_price: basePrice,
          total_price: totalPrice,
          status: "pending",
          technician_id: input.technician_id || null,
          scheduling_type: input.scheduling_type || "now",
          scheduled_date: input.scheduled_date || null,
          scheduled_time: input.scheduled_time || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Solicitação criada!",
        description: "Estamos buscando técnicos próximos a você.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept a service request (for technicians)
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Check if technician already has an active service
      const { data: hasActive, error: checkError } = await supabase
        .rpc("technician_has_active_service", { tech_user_id: user.id });

      if (checkError) throw checkError;
      if (hasActive) throw new Error("Você já possui um serviço ativo. Conclua-o antes de aceitar outro.");

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          technician_id: user.id,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select()
        .single();

      if (error) throw error;

      // Send notification to client that technician is on the way
      if (data.client_id && profile?.name) {
        await supabase.from("notifications").insert({
          user_id: data.client_id,
          title: "Técnico a caminho! 🎉",
          message: `${profile.name} aceitou sua solicitação e está a caminho.`,
          type: "service_accepted",
          data: { 
            service_request_id: requestId,
            technician_name: profile.name,
          },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Solicitação aceita!",
        description: "O cliente foi notificado que você está a caminho.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aceitar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start a service
  const startService = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Serviço iniciado!",
        description: "O cliente foi notificado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao iniciar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete a service
  const completeService = useMutation({
    mutationFn: async ({ requestId, extras, completionPhotos, completionCode }: { requestId: string; extras?: any[]; completionPhotos?: string[]; completionCode?: string }) => {
      // Validate completion code first
      if (!completionCode) throw new Error("Código de finalização obrigatório");

      const { data: isValid, error: codeError } = await supabase
        .rpc("validate_completion_code", { request_id: requestId, code: completionCode });

      if (codeError) throw codeError;
      if (!isValid) throw new Error("Código de finalização inválido. Confirme o código com o cliente.");

      // Calculate new total if extras were added
      let updateData: any = {
        status: "completed",
        completed_at: new Date().toISOString(),
      };

      // Get current request data
      const { data: current } = await supabase
        .from("service_requests")
        .select("base_price, urgency, client_id, category_id")
        .eq("id", requestId)
        .single();

      if (current) {
        const urgencyMultiplier = current.urgency === "urgent" ? 1.2 : 1;
        let totalPrice = current.base_price * urgencyMultiplier;
        
        if (extras && extras.length > 0) {
          const extrasTotal = extras.reduce((sum, extra) => sum + (extra.price || 0), 0);
          updateData.extras = extras;
          totalPrice += extrasTotal;
        }
        
        // Add completion photos if provided
        if (completionPhotos && completionPhotos.length > 0) {
          updateData.completion_photos = completionPhotos;
        }
        
        updateData.total_price = totalPrice;
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to client that service is complete
      if (current?.client_id) {
        const { data: category } = await supabase
          .from("service_categories")
          .select("name")
          .eq("id", current.category_id)
          .single();

        await supabase.from("notifications").insert({
          user_id: current.client_id,
          title: "Serviço concluído!",
          message: `Seu serviço de ${category?.name || "técnico"} foi concluído. Total: ${(updateData.total_price || data.total_price).toLocaleString()} Kz. Avalie o serviço!`,
          type: "service_update",
          data: { service_request_id: requestId, total_price: updateData.total_price || data.total_price },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Serviço concluído!",
        description: "O cliente foi notificado e poderá avaliar o serviço.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao concluir serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel a service request
  const cancelRequest = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      if (!profile) throw new Error("Perfil não encontrado");

      // Check if technician has arrived (status is in_progress)
      const { data: current } = await supabase
        .from("service_requests")
        .select("status")
        .eq("id", requestId)
        .single();

      // Get cancellation fee from settings
      let cancellationFee = 0;
      if (current?.status === "in_progress" && profile.role === "client") {
        const { data: feeSetting } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "cancellation_fee")
          .maybeSingle();
        cancellationFee = feeSetting ? Number(feeSetting.value) : 2000;
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          cancelled_by: profile.role,
          cancellation_fee: cancellationFee,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Solicitação cancelada",
        description: "O motivo foi registrado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cancelar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rate a completed service (for clients)
  const rateService = useMutation({
    mutationFn: async ({ requestId, rating, feedback }: { requestId: string; rating: number; feedback?: string }) => {
      const { data: request, error: fetchError } = await supabase
        .from("service_requests")
        .select("technician_id, client_id, category_id")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request.technician_id) throw new Error("Técnico não encontrado");

      // Update request with rating
      const { error: updateError } = await supabase
        .from("service_requests")
        .update({ rating, feedback })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Check if review already exists for this service request
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("service_request_id", requestId)
        .maybeSingle();

      // Only create review if it doesn't exist
      if (!existingReview) {
        const { error: reviewError } = await supabase
          .from("reviews")
          .insert({
            service_request_id: requestId,
            client_id: request.client_id,
            technician_id: request.technician_id,
            rating,
            comment: feedback,
          });

        if (reviewError) throw reviewError;
      }

      // Get all reviews for this technician and calculate average
      const { data: reviews, error: reviewsFetchError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("technician_id", request.technician_id);

      if (reviewsFetchError) {
        console.error("Error fetching reviews:", reviewsFetchError);
      }

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        // Update technician rating and review count
        const { error: techUpdateError } = await supabase
          .from("technicians")
          .update({
            rating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
            review_count: reviews.length,
          })
          .eq("user_id", request.technician_id);

        if (techUpdateError) {
          console.error("Error updating technician:", techUpdateError);
          throw techUpdateError;
        }
      }

      // Get client name and category for notification
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", request.client_id)
        .single();

      const { data: category } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", request.category_id)
        .single();

      // Send notification to technician about the rating
      const starEmoji = "⭐".repeat(rating);
      await supabase.from("notifications").insert({
        user_id: request.technician_id,
        title: `Nova Avaliação: ${starEmoji}`,
        message: `${clientProfile?.name || "Um cliente"} avaliou seu serviço de ${category?.name || "técnico"} com ${rating} estrela${rating > 1 ? "s" : ""}!${feedback ? ` "${feedback}"` : ""}`,
        type: "rating",
        data: { 
          service_request_id: requestId, 
          rating,
          feedback,
          client_name: clientProfile?.name,
        },
      });

      // Invalidate technicians query to refresh data
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      // Invalidate notifications to refresh
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      return { rating, feedback };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send a quote (for technicians)
  const sendQuote = useMutation({
    mutationFn: async ({ requestId, amount, description }: { requestId: string; amount: number; description: string }) => {
      if (!user || !profile) throw new Error("Usuário não autenticado");

      // Check if technician already has an active service
      const { data: hasActive } = await supabase
        .rpc("technician_has_active_service", { tech_user_id: user.id });
      if (hasActive) throw new Error("Você já possui um serviço ativo. Conclua-o antes de aceitar outro.");

      // First accept the request (assign technician)
      const { data: current } = await supabase
        .from("service_requests")
        .select("status, technician_id, client_id, category_id")
        .eq("id", requestId)
        .single();

      if (!current) throw new Error("Solicitação não encontrada");

      const updateData: any = {
        quote_amount: amount,
        quote_description: description,
        quote_status: "sent",
        quote_sent_at: new Date().toISOString(),
        total_price: amount,
      };

      // If still pending, also accept it
      if (current.status === "pending") {
        updateData.technician_id = user.id;
        updateData.status = "accepted";
        updateData.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      // Notify client
      const { data: category } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", current.category_id)
        .single();

      await supabase.from("notifications").insert({
        user_id: current.client_id,
        title: "Orçamento recebido! 📋",
        message: `${profile.name} enviou um orçamento de ${amount.toLocaleString()} Kz para ${category?.name || "seu serviço"}. Aprove para iniciar.`,
        type: "quote_received",
        data: { service_request_id: requestId, quote_amount: amount },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Orçamento enviado!",
        description: "O cliente foi notificado e poderá aprovar ou recusar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve a quote (for clients)
  const approveQuote = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          quote_status: "approved",
          quote_approved_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("client_id", user.id)
        .select("*, technician_id, category_id")
        .single();

      if (error) throw error;

      // Notify technician
      if (data.technician_id) {
        const { data: category } = await supabase
          .from("service_categories")
          .select("name")
          .eq("id", data.category_id)
          .single();

        await supabase.from("notifications").insert({
          user_id: data.technician_id,
          title: "Orçamento aprovado! ✅",
          message: `O cliente aprovou seu orçamento de ${data.quote_amount?.toLocaleString()} Kz para ${category?.name || "o serviço"}. Pode iniciar o trabalho!`,
          type: "quote_approved",
          data: { service_request_id: requestId },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Orçamento aprovado!",
        description: "O técnico foi notificado e poderá iniciar o serviço.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject a quote (for clients)
  const rejectQuote = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("service_requests")
        .update({
          quote_status: "rejected",
        })
        .eq("id", requestId)
        .eq("client_id", user.id)
        .select("*, technician_id, category_id")
        .single();

      if (error) throw error;

      // Notify technician
      if (data.technician_id) {
        await supabase.from("notifications").insert({
          user_id: data.technician_id,
          title: "Orçamento recusado ❌",
          message: `O cliente recusou seu orçamento de ${data.quote_amount?.toLocaleString()} Kz. Pode enviar um novo orçamento.`,
          type: "quote_rejected",
          data: { service_request_id: requestId },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Orçamento recusado",
        description: "O técnico foi notificado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao recusar orçamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest,
    acceptRequest,
    startService,
    completeService,
    cancelRequest,
    rateService,
    sendQuote,
    approveQuote,
    rejectQuote,
    refetch,
  };
}
