import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Specialty {
  id: string;
  category_id: string | null;
  service_id: string | null;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export function useSpecialties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: specialties = [], isLoading, error } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data: specialtiesData, error } = await supabase
        .from("specialties")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      // Fetch categories
      const categoryIds = [...new Set(specialtiesData?.map((s) => s.category_id).filter(Boolean) || [])];
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds);

        return (specialtiesData || []).map((specialty) => ({
          ...specialty,
          category: categories?.find((c) => c.id === specialty.category_id),
        })) as Specialty[];
      }

      return specialtiesData as Specialty[];
    },
  });

  const createSpecialty = useMutation({
    mutationFn: async (specialty: { name: string; description?: string | null; category_id: string; active?: boolean }) => {
      const { data, error } = await supabase
        .from("specialties")
        .insert({
          name: specialty.name,
          description: specialty.description || null,
          category_id: specialty.category_id,
          service_id: null, // No longer required
          active: specialty.active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      toast({
        title: "Especialidade criada!",
        description: "A nova especialidade foi adicionada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar especialidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSpecialty = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Specialty> & { id: string }) => {
      const { data, error } = await supabase
        .from("specialties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      toast({
        title: "Especialidade atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar especialidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSpecialty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("specialties")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
      toast({
        title: "Especialidade removida!",
        description: "A especialidade foi desativada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover especialidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    specialties,
    isLoading,
    error,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
  };
}
