import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  icon: string;
  base_price: number;
  commission_percentage: number;
  price_type: "fixed" | "quote";
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export function useServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data: servicesData, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      // Fetch categories
      const categoryIds = [...new Set(servicesData?.map((s) => s.category_id) || [])];
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds);

        return (servicesData || []).map((service) => ({
          ...service,
          category: categories?.find((c) => c.id === service.category_id),
        })) as Service[];
      }

      return servicesData as Service[];
    },
  });

  const createService = useMutation({
    mutationFn: async (service: Omit<Service, "id" | "created_at" | "updated_at" | "category">) => {
      const { data, error } = await supabase
        .from("services")
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Serviço criado!",
        description: "O novo serviço foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Serviço atualizado!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({
        title: "Serviço removido!",
        description: "O serviço foi desativado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
  };
}
