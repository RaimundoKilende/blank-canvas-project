import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface SupportTicket {
  id: string;
  reporter_id: string;
  reporter_role: string;
  against_id: string | null;
  service_request_id: string | null;
  subject: string;
  description: string;
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  ticket_type: string;
  evidence_photos: string[] | null;
  technician_response: string | null;
  response_deadline: string | null;
  verdict: string | null;
  verdict_notes: string | null;
  reporter?: { name: string; email: string };
  against?: { name: string; email: string };
}

export function useSupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", profile?.role, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set([
        ...data.map((t: any) => t.reporter_id),
        ...data.map((t: any) => t.against_id).filter(Boolean),
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      return data.map((ticket: any) => ({
        ...ticket,
        reporter: profiles?.find((p: any) => p.user_id === ticket.reporter_id),
        against: profiles?.find((p: any) => p.user_id === ticket.against_id),
      })) as SupportTicket[];
    },
    enabled: !!user,
  });

  // Tickets where current user is the "against" (disputes against them)
  const myDisputes = tickets.filter(
    t => t.ticket_type === "dispute" && t.against_id === user?.id
  );

  // Pending disputes needing technician response
  const pendingDefense = myDisputes.filter(
    t => t.status === "awaiting_response" && !t.technician_response
  );

  const createTicket = useMutation({
    mutationFn: async (input: {
      subject: string;
      description: string;
      against_id?: string;
      service_request_id?: string;
      ticket_type?: string;
      evidence_photos?: string[];
    }) => {
      if (!user || !profile) throw new Error("Não autenticado");

      const isDispute = input.ticket_type === "dispute";
      const responseDeadline = isDispute
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          reporter_id: user.id,
          reporter_role: profile.role,
          against_id: input.against_id || null,
          service_request_id: input.service_request_id || null,
          subject: input.subject,
          description: input.description,
          ticket_type: input.ticket_type || "support",
          evidence_photos: input.evidence_photos || [],
          status: isDispute ? "awaiting_response" : "open",
          response_deadline: responseDeadline,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify the technician about the dispute
      if (isDispute && input.against_id) {
        await supabase.from("notifications").insert({
          user_id: input.against_id,
          title: "⚠️ Disputa aberta contra você",
          message: `Um cliente reportou um problema: "${input.subject}". Tens 24h para apresentar a tua defesa.`,
          type: "dispute",
          data: { ticket_id: data.id, service_request_id: input.service_request_id },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "Ticket criado!", description: "A equipa de suporte irá analisar o seu caso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar ticket", description: error.message, variant: "destructive" });
    },
  });

  const respondToDispute = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          technician_response: response,
          status: "under_review",
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "Resposta enviada!", description: "O admin irá analisar o caso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao responder", description: error.message, variant: "destructive" });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; status?: string; admin_notes?: string; resolution?: string; 
      verdict?: string; verdict_notes?: string;
      suspend_technician?: boolean; ban_technician?: string;
      transfer_credits?: boolean; discount_amount?: number; discount_reason?: string;
    }) => {
      const { suspend_technician, ban_technician, transfer_credits, discount_amount, discount_reason, ...dbUpdates } = updates;
      const updateData: any = { ...dbUpdates };
      if (updates.status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Get ticket details for actions
      const ticket = tickets.find(t => t.id === id);

      // Notify both parties about verdict
      if (updates.verdict && ticket) {
        const verdictLabels: Record<string, string> = {
          technician_fault: "Culpa do Técnico",
          client_misuse: "Mau uso do Cliente",
          partial: "Responsabilidade Parcial",
        };
        const verdictLabel = verdictLabels[updates.verdict] || updates.verdict;
        const verdictMsg = `Veredito: ${verdictLabel}. ${updates.verdict_notes || ""}`.trim();

        const notifyUsers: string[] = [];
        if (ticket.reporter_id) notifyUsers.push(ticket.reporter_id);
        if (ticket.against_id) notifyUsers.push(ticket.against_id);

        const notifications = notifyUsers.map(uid => ({
          user_id: uid,
          title: "⚖️ Veredito da disputa",
          message: `A disputa "${ticket.subject}" foi analisada. ${verdictMsg}`,
          type: "dispute_verdict",
          data: { ticket_id: id, verdict: updates.verdict, service_request_id: ticket.service_request_id },
        }));

        if (notifications.length > 0) {
          await supabase.from("notifications").insert(notifications);
        }

        // Also notify about resolution if provided
        if (updates.resolution) {
          const resolutionNotifs = notifyUsers.map(uid => ({
            user_id: uid,
            title: "✅ Resolução da disputa",
            message: `Resolução: ${updates.resolution}`,
            type: "dispute_resolution",
            data: { ticket_id: id, service_request_id: ticket.service_request_id },
          }));
          await supabase.from("notifications").insert(resolutionNotifs);
        }
      }

      // Suspend/ban technician
      if ((suspend_technician || ban_technician) && ticket?.against_id) {
        const { data: techRecord } = await supabase
          .from("technicians")
          .select("id, credits")
          .eq("user_id", ticket.against_id)
          .single();

        if (techRecord) {
          await supabase
            .from("technicians")
            .update({
              suspended: true,
              suspended_at: new Date().toISOString(),
              suspension_reason: updates.verdict_notes || "Disputa perdida",
              active: false,
            })
            .eq("id", techRecord.id);

          // Transfer credits as discount to client
          if (transfer_credits && techRecord.credits > 0 && ticket.reporter_id) {
            await supabase
              .from("technicians")
              .update({ credits: 0 })
              .eq("id", techRecord.id);

            // Notify client about credit discount
            await supabase.from("notifications").insert({
              user_id: ticket.reporter_id,
              title: "🎁 Desconto concedido",
              message: `Recebeste ${techRecord.credits} créditos de desconto para o teu próximo serviço, como compensação pela disputa resolvida a teu favor.`,
              type: "discount",
              data: { credits: techRecord.credits, ticket_id: id },
            });
          }

          // Notify technician about suspension
          await supabase.from("notifications").insert({
            user_id: ticket.against_id,
            title: "⚠️ Conta suspensa",
            message: `A tua conta foi suspensa devido ao resultado da disputa: "${ticket.subject}". ${updates.verdict_notes || ""}`,
            type: "suspension",
            data: { ticket_id: id },
          });
        }
      }

      // Admin discount on service
      if (discount_amount && discount_amount > 0 && ticket?.service_request_id) {
        await supabase
          .from("service_requests")
          .update({ 
            admin_discount: discount_amount,
            admin_discount_reason: discount_reason || "Desconto administrativo"
          })
          .eq("id", ticket.service_request_id);

        if (ticket.reporter_id) {
          await supabase.from("notifications").insert({
            user_id: ticket.reporter_id,
            title: "💰 Desconto aplicado",
            message: `Foi aplicado um desconto de ${discount_amount.toLocaleString()} Kz no teu serviço como compensação.`,
            type: "discount",
            data: { discount: discount_amount, ticket_id: id },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "Ticket atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  return { tickets, isLoading, createTicket, updateTicket, respondToDispute, myDisputes, pendingDefense };
}
