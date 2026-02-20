import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Vendor {
  id: string;
  user_id: string;
  vendor_type: string;
  store_name: string | null;
  store_description: string | null;
  store_logo: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  verified: boolean;
  rating: number;
  review_count: number;
  completed_orders: number;
  wallet_balance: number;
  documents: string[] | null;
  motivation: string | null;
  years_experience: string | null;
  availability: string | null;
  work_areas: string[] | null;
  certifications: string | null;
  previous_experience: string | null;
  created_at: string;
  updated_at: string;
  profile?: any;
}

export function useVendorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendor-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Vendor | null;
    },
    enabled: !!user,
  });

  const updateVendor = useMutation({
    mutationFn: async (updates: Partial<Vendor>) => {
      const { data, error } = await supabase
        .from("vendors")
        .update(updates)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast({ title: "Perfil atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { vendor, isLoading, updateVendor };
}

export function useAllVendors() {
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["all-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*, profile:profiles!vendors_user_id_fkey(*)")
        .eq("active", true)
        .eq("verified", true)
        .order("store_name");
      // If the join fails due to missing FK, fall back
      if (error) {
        const { data: fallback, error: fbErr } = await supabase
          .from("vendors")
          .select("*")
          .eq("active", true)
          .eq("verified", true)
          .order("store_name");
        if (fbErr) throw fbErr;
        return fallback as Vendor[];
      }
      return data as Vendor[];
    },
  });

  return { vendors, isLoading };
}
