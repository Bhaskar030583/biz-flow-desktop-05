
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { LossType } from "./LossFilters";

interface LossFormData {
  product_id: string;
  hr_shop_id: string;
  shift_id: string;
  loss_type: LossType;
  quantity_lost: number;
  reason: string | null;
  operator_name: string | null;
}

export const useLossTracking = (
  selectedDate: Date,
  filterShop: string,
  filterProduct: string,
  filterLossType: LossType | ""
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch HR stores
  const { data: stores } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch shifts
  const { data: shifts } = useQuery({
    queryKey: ['hr-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name')
        .eq('is_active', true)
        .order('shift_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch losses with filters
  const { data: losses, isLoading } = useQuery({
    queryKey: ['losses', selectedDate, filterShop, filterProduct, filterLossType],
    queryFn: async () => {
      let query = supabase
        .from('losses')
        .select(`
          *,
          products (name),
          hr_stores!losses_hr_shop_id_fkey (store_name)
        `)
        .eq('user_id', user?.id)
        .eq('loss_date', format(selectedDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (filterShop) {
        query = query.eq('hr_shop_id', filterShop);
      }
      if (filterProduct) {
        query = query.eq('product_id', filterProduct);
      }
      if (filterLossType) {
        query = query.eq('loss_type', filterLossType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(loss => ({
        ...loss,
        product_name: loss.products?.name || 'Unknown Product',
        store_name: loss.hr_stores?.store_name || 'Unknown Store'
      }));
    },
  });

  // Add new loss mutation
  const addLossMutation = useMutation({
    mutationFn: async (lossData: LossFormData) => {
      const { data, error } = await supabase
        .from('losses')
        .insert({
          user_id: user?.id,
          product_id: lossData.product_id,
          hr_shop_id: lossData.hr_shop_id,
          shift_id: lossData.shift_id,
          loss_type: lossData.loss_type,
          quantity_lost: lossData.quantity_lost,
          reason: lossData.reason,
          operator_name: lossData.operator_name,
          loss_date: format(selectedDate, 'yyyy-MM-dd')
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Loss recorded successfully");
      queryClient.invalidateQueries({ queryKey: ['losses'] });
    },
    onError: (error) => {
      console.error('Error recording loss:', error);
      toast.error("Failed to record loss");
    },
  });

  return {
    stores,
    products,
    shifts,
    losses,
    isLoading,
    addLossMutation
  };
};
