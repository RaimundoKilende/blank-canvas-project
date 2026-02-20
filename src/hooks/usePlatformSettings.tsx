import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePlatformSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data;
    },
  });

  const getSetting = (key: string): string | null => {
    const setting = settings.find((s: any) => s.key === key);
    return setting?.value ?? null;
  };

  const getSettingNumber = (key: string, fallback: number = 0): number => {
    const val = getSetting(key);
    return val ? Number(val) : fallback;
  };

  const updateSetting = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const { data: existing } = await supabase
        .from("platform_settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value, ...(description ? { description } : {}) })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_settings")
          .insert({ key, value, description });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast({ title: "Configuração salva!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  return { settings, isLoading, getSetting, getSettingNumber, updateSetting };
}
