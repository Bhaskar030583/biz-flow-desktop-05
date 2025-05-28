
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
  sold_quantity?: number;
  expected_closing?: number;
  actual_stock?: number;
  variance?: number;
  last_stock_date?: string;
  shop_id: string;
  shop_name: string;
}

export const useAssignedProducts = (refreshTrigger: number, selectedShopId?: string) => {
  const { user } = useAuth();

  console.log('📦 [useAssignedProducts] Hook called with:', {
    refreshTrigger,
    selectedShopId,
    userId: user?.id
  });

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
      
      console.log('✅ [useAssignedProducts] Successfully fetched HR stores:', data?.length, 'stores');
      return data || [];
    },
    enabled: !!user?.id
  });

  // Transform hr_stores data to match the expected interface
  const stores = storesData?.map(store => ({
    id: store.id,
    name: store.store_name
  })) || [];

  // Fetch assigned products with current stock data
  const { data: assignedProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assigned-products-with-stock', refreshTrigger],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ [useAssignedProducts] No user ID available');
        return [];
      }
      
      console.log('📦 [useAssignedProducts] Fetching assigned products with stock data for user:', user.id);
      
      // Get all product assignments from product_shops table
      const { data: productShops, error: productShopsError } = await supabase
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
      
      if (productShopsError) {
        console.error('❌ [useAssignedProducts] Error fetching product assignments:', productShopsError);
        throw productShopsError;
      }

      if (!productShops || productShops.length === 0) {
        console.log('⚠️ [useAssignedProducts] No product assignments found');
        return [];
      }

      // Get today's date for stock queries
      const today = new Date().toISOString().split('T')[0];

      // For each assignment, get the current stock data
      const assignedProducts: AssignedProduct[] = [];

      for (const assignment of productShops) {
        if (!assignment.products) {
          console.log('⚠️ [useAssignedProducts] Skipping assignment without product data:', assignment.id);
          continue;
        }

        const product = assignment.products;
        
        // Get stock data for this product at this store for today
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

        const assignedProduct: AssignedProduct = {
          assignment_id: assignment.id,
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost_price: product.cost_price,
          opening_stock: stockData?.opening_stock || 0,
          stock_added: stockData?.stock_added || 0,
          sold_quantity: stockData?.sold_quantity || 0,
          expected_closing: stockData?.expected_closing || 0,
          actual_stock: stockData?.actual_stock,
          variance: stockData?.variance || 0,
          last_stock_date: stockData?.stock_date || null,
          shop_id: assignment.shop_id,
          shop_name: hrStore?.store_name || 'Unknown Store'
        };

        assignedProducts.push(assignedProduct);
      }

      console.log('✅ [useAssignedProducts] Final assigned products with stock:', assignedProducts.length);
      return assignedProducts;
    },
    enabled: !!user?.id && !!storesData
  });

  // Get unique products for filter dropdown
  const products = assignedProductsData?.map(product => ({
    id: product.id,
    name: product.name
  })) || [];

  // Remove duplicates
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  );

  return {
    assignedProducts: assignedProductsData || [],
    loading: storesLoading || productsLoading,
    shops: stores,
    products: uniqueProducts
  };
};
