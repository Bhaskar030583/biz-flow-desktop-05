
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
      console.log('🏪 [useAssignedProducts] Store details:', data?.map(s => ({ id: s.id, name: s.store_name })));
      return data || [];
    },
    enabled: !!user?.id
  });

  // Transform hr_stores data to match the expected interface
  const stores = storesData?.map(store => ({
    id: store.id,
    name: store.store_name
  })) || [];

  // Fetch assigned products - always fetch all, filter in the UI
  const { data: assignedProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assigned-products-all-stores', refreshTrigger],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ [useAssignedProducts] No user ID available');
        return [];
      }
      
      console.log('📦 [useAssignedProducts] Fetching all assigned products for user:', user.id);
      
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

      console.log('📦 [useAssignedProducts] Raw product assignments:', productShops?.length);
      console.log('📦 [useAssignedProducts] Assignment details:', productShops?.map(ps => ({
        assignmentId: ps.id,
        productId: ps.product_id,
        shopId: ps.shop_id,
        productName: ps.products?.name
      })));

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
        
        console.log('📦 [useAssignedProducts] Processing assignment:', {
          assignmentId: assignment.id,
          productId: product.id,
          productName: product.name,
          shopId: assignment.shop_id
        });
        
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
        
        console.log('🏪 [useAssignedProducts] Store lookup:', {
          assignmentShopId: assignment.shop_id,
          hrStoreFound: !!hrStore,
          hrStoreName: hrStore?.store_name,
          allStoreIds: storesData?.map(s => s.id)
        });

        const soldQuantity = stockData ? (stockData.opening_stock + (stockData.stock_added || 0)) - stockData.actual_stock : 0;

        const assignedProduct: AssignedProduct = {
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
          shop_id: assignment.shop_id, // This should be the HR store ID
          shop_name: hrStore?.store_name || 'Unknown Store'
        };

        console.log('📦 [useAssignedProducts] Created assigned product:', {
          name: assignedProduct.name,
          shopId: assignedProduct.shop_id,
          shopName: assignedProduct.shop_name,
          assignmentId: assignedProduct.assignment_id
        });

        assignedProducts.push(assignedProduct);
      }

      console.log('✅ [useAssignedProducts] Final assigned products:', {
        totalProducts: assignedProducts.length,
        uniqueShops: [...new Set(assignedProducts.map(p => p.shop_id))],
        shopBreakdown: assignedProducts.reduce((acc, p) => {
          acc[`${p.shop_id}:${p.shop_name}`] = (acc[`${p.shop_id}:${p.shop_name}`] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

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

  console.log('📦 [useAssignedProducts] Hook returning:', {
    assignedProductsCount: assignedProductsData?.length || 0,
    storesCount: stores.length,
    productsCount: uniqueProducts.length,
    loading: storesLoading || productsLoading
  });

  return {
    assignedProducts: assignedProductsData || [],
    loading: storesLoading || productsLoading,
    shops: stores,
    products: uniqueProducts
  };
};
