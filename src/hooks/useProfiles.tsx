import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "technician" | "client";
  client_type: string | null;
  company_name: string | null;
  nif: string | null;
  organization_type: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile: currentProfile } = useAuth();

  // Fetch all profiles (admin only)
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Profile[];
    },
    enabled: currentProfile?.role === "admin",
  });

  // Filter by role
  const clients = profiles.filter((p) => p.role === "client");
  const technicians = profiles.filter((p) => p.role === "technician");

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      // Find the profile to get user_id
      const profile = profiles.find((p) => p.id === id);
      if (!profile) throw new Error("Perfil não encontrado");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Perfil atualizado!",
        description: "As alterações foram salvas.",
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

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const profile = profiles.find((p) => p.id === id);
      if (!profile) throw new Error("Perfil não encontrado");

      // If technician, also delete from technicians table
      if (profile.role === "technician") {
        await supabase
          .from("technicians")
          .delete()
          .eq("user_id", profile.user_id);
      }

      // Delete from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", profile.user_id);

      // Delete profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "Perfil removido!",
        description: "O usuário foi removido do sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profiles,
    clients,
    technicians,
    isLoading,
    error,
    updateProfile,
    deleteProfile,
  };
}
