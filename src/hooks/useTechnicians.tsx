import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Technician {
  id: string;
  user_id: string;
  bio: string | null;
  specialties: string[];
  verified: boolean;
  active: boolean;
  rejected: boolean;
  rating: number;
  review_count: number;
  completed_jobs: number;
  credits: number;
  wallet_balance: number;
  latitude: number | null;
  longitude: number | null;
  documents: string[];
  created_at: string;
  updated_at: string;
  // Interview data
  years_experience: string | null;
  availability: string | null;
  work_areas: string[] | null;
  has_own_tools: boolean | null;
  has_transport: boolean | null;
  certifications: string | null;
  motivation: string | null;
  previous_experience: string | null;
  portfolio_photos: string[];
  profile?: {
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export function useTechnicians(filterBySpecialty?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch all active and verified technicians (for clients)
  const { data: technicians = [], isLoading, error } = useQuery({
    queryKey: ["technicians", filterBySpecialty],
    queryFn: async () => {
      const { data: techData, error: techError } = await supabase
        .from("technicians")
        .select("*")
        .eq("active", true)
        .eq("verified", true)
        .order("rating", { ascending: false });

      if (techError) throw techError;

      // Fetch profiles separately
      const userIds = techData?.map((t) => t.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email, phone, avatar_url")
        .in("user_id", userIds);

      let result = (techData || []).map((tech) => ({
        ...tech,
        profile: profiles?.find((p) => p.user_id === tech.user_id),
      })) as Technician[];

      // Filter by specialty if provided
      if (filterBySpecialty) {
        result = result.filter((tech) => 
          tech.specialties && tech.specialties.some(
            (s) => s.toLowerCase() === filterBySpecialty.toLowerCase()
          )
        );
      }

      return result;
    },
  });

  // Fetch pending technicians (for admin)
  const { data: pendingTechnicians = [], isLoading: loadingPending } = useQuery({
    queryKey: ["technicians", "pending"],
    queryFn: async () => {
      const { data: techData, error: techError } = await supabase
        .from("technicians")
        .select("*")
        .eq("verified", false)
        .order("created_at", { ascending: false });

      if (techError) throw techError;

      // Fetch profiles separately
      const userIds = techData?.map((t) => t.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email, phone, avatar_url")
        .in("user_id", userIds);

      return (techData || []).map((tech) => ({
        ...tech,
        profile: profiles?.find((p) => p.user_id === tech.user_id),
      })) as Technician[];
    },
    enabled: profile?.role === "admin",
  });

  // Get current user's technician profile
  const { data: myTechnicianProfile, isLoading: loadingMyProfile } = useQuery({
    queryKey: ["technician-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Technician | null;
    },
    enabled: !!user && profile?.role === "technician",
  });

  // Update technician online/offline status
  const updateStatus = useMutation({
    mutationFn: async (active: boolean) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("technicians")
        .update({ active })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
      toast({
        title: data.active ? "Você está online!" : "Você está offline",
        description: data.active
          ? "Você receberá novas solicitações."
          : "Você não receberá novas solicitações.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update technician location
  const updateLocation = useMutation({
    mutationFn: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("technicians")
        .update({ latitude, longitude })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
    },
  });

  // Update technician profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Technician>) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("technicians")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technician-profile"] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve technician (admin only)
  const approveTechnician = useMutation({
    mutationFn: async (technicianId: string) => {
      const { data, error } = await supabase
        .from("technicians")
        .update({ verified: true, active: true })
        .eq("id", technicianId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "Técnico aprovado!",
        description: "O técnico agora pode receber solicitações.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar técnico",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject technician (admin only)
  const rejectTechnician = useMutation({
    mutationFn: async (technicianId: string) => {
      const { data, error } = await supabase
        .from("technicians")
        .update({ rejected: true, verified: false, active: false })
        .eq("id", technicianId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "Técnico recusado",
        description: "A candidatura foi marcada como recusada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao recusar técnico",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    technicians,
    pendingTechnicians,
    myTechnicianProfile,
    isLoading,
    loadingPending,
    loadingMyProfile,
    error,
    updateStatus,
    updateLocation,
    updateProfile,
    approveTechnician,
    rejectTechnician,
  };
}
