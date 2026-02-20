import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface VendorCategory {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  icon: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  photos: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: VendorCategory;
}

export function useVendorCategories(vendorId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active global categories (admin-managed)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["vendor-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_categories")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as VendorCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (cat: { name: string; description?: string | null; vendor_id?: string | null }) => {
      const { data, error } = await supabase.from("vendor_categories").insert({
        name: cat.name,
        description: cat.description || null,
        vendor_id: cat.vendor_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-categories"] });
      toast({ title: "Categoria criada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorCategory> & { id: string }) => {
      const { data, error } = await supabase.from("vendor_categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-categories"] });
      toast({ title: "Categoria atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-categories"] });
      toast({ title: "Categoria removida!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { categories, isLoading, createCategory, updateCategory, deleteCategory };
}

export function useProducts(vendorId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", vendorId],
    queryFn: async () => {
      let query = supabase.from("products").select("*, category:vendor_categories(*)").order("created_at", { ascending: false });
      if (vendorId) query = query.eq("vendor_id", vendorId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: Partial<Product> & { vendor_id: string; name: string; price: number }) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto removido!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { products, isLoading, createProduct, updateProduct, deleteProduct };
}
