import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: any;
}

export interface Order {
  id: string;
  client_id: string;
  vendor_id: string;
  status: string;
  total_price: number;
  payment_method: string;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  client_profile?: any;
  vendor_profile?: any;
}

export function useOrders(role: "client" | "vendor" = "client") {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", role, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*, product:products(name, photos))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async ({ 
      vendor_id, items, delivery_address, notes, total_price 
    }: { 
      vendor_id: string; 
      items: { product_id: string; quantity: number; unit_price: number }[];
      delivery_address?: string;
      notes?: string;
      total_price: number;
    }) => {
      if (!user) throw new Error("Não autenticado");
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          client_id: user.id,
          vendor_id,
          delivery_address: delivery_address || null,
          notes: notes || null,
          total_price,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido criado com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar pedido", description: e.message, variant: "destructive" }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Estado atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { orders, isLoading, createOrder, updateOrderStatus };
}
