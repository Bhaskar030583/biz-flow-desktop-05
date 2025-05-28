
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
  shop_id: string; // Required field for shop filtering
  shop_name: string; // Required field for display
}

export const useAssignedProducts = (refreshTrigger: number, selectedShopId?: string) => {
  const { user } = useAuth();

  // Fetch HRMS stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['hr-stores-for-stock'],
    queryFn: async () => {
      console.log('🏪 [useAssignedProducts] Fetching HR stores for stock list');
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      if (error) {
        console.error('❌ [useAssignedProducts] Error fetching hr_stores:', error);
        throw error;
      }
      
      console.log('✅ [useAssignedProducts] Successfully fetched HR stores:', data);
      return data || [];
    },
    enabled: !!user?.id
  });

  // Transform hr_stores data to match the expected interface
  const stores = storesData?.map(store => ({
    id: store.id,
    name: store.store_name
  })) || [];

  // Fetch assigned products from all stores or specific store
  const { data: assignedProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assigned-products-all-stores', refreshTrigger, selectedShopId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('📦 [useAssignedProducts] Fetching assigned products, selectedShopId:', selectedShopId);
      
      // Get product assignments from product_shops table
      let query = supabase
        .from('product_shops')
        .select(`
          id,
          product_id,
          shop_id,
          products (
            id,
            name,
            category,
            price,
            cost_price
          )
        `)
        .eq('user_id', user?.id);

      // If a specific shop is selected and it's not "_all", filter by that shop
      if (selectedShopId && selectedShopId !== "_all") {
        console.log('🎯 [useAssignedProducts] Filtering by shop ID:', selectedShopId);
        query = query.eq('shop_id', selectedShopId);
      }

      const { data: productShops, error: productShopsError } = await query;
      
      if (productShopsError) {
        console.error('❌ [useAssignedProducts] Error fetching product assignments:', productShopsError);
        throw productShopsError;
      }

      console.log('📦 [useAssignedProducts] Product assignments:', productShops);

      if (!productShops || productShops.length === 0) {
        console.log('⚠️ [useAssignedProducts] No product assignments found for shop:', selectedShopId);
        return [];
      }

      // Get today's date for stock queries
      const today = new Date().toISOString().split('T')[0];

      // For each assignment, get the current stock data
      const assignedProducts: AssignedProduct[] = [];

      for (const assignment of productShops) {
        if (!assignment.products) continue;

        const product = assignment.products;
        
        // Get stock data for this product at this store
        const { data: stockData, error: stockError } = await supabase
          .from('stocks')
          .select('*')
          .eq('product_id', product.id)
          .eq('shop_id', assignment.shop_id)
          .eq('stock_date', today)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (stockError) {
          console.error('❌ [useAssignedProducts] Error fetching stock for product:', product.name, stockError);
        }

        // Find the corresponding HR store name
        const hrStore = storesData?.find(store => store.id === assignment.shop_id);

        const soldQuantity = stockData ? (stockData.opening_stock + (stockData.stock_added || 0)) - stockData.actual_stock : 0;

        assignedProducts.push({
          assignment_id: assignment.id,
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost_price: product.cost_price,
          opening_stock: stockData?.opening_stock || 0,
          stock_added: stockData?.stock_added || 0,
          closing_stock: stockData?.closing_stock || 0,
          actual_stock: stockData?.actual_stock || 0,
          last_stock_date: stockData?.stock_date || null,
          sold_quantity: soldQuantity,
          shop_id: assignment.shop_id,
          shop_name: hrStore?.store_name || 'Unknown Store'
        });
      }

      console.log('✅ [useAssignedProducts] Final assigned products with stock:', assignedProducts);
      return assignedProducts;
    },
    enabled: !!user?.id && !!storesData
  });

  // Get unique products for filter dropdown
  const products = assignedProductsData?.map(product => ({
    id: product.id,
    name: product.name
  })) || [];

  return {
    assignedProducts: assignedProductsData || [],
    loading: storesLoading || productsLoading,
    shops: stores,
    products
  };
};
