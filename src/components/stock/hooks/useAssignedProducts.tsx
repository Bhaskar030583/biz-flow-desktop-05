
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

  // Fetch assigned products with current stock data using hr_shop_id
  const { data: assignedProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assigned-products-with-stock', refreshTrigger],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ [useAssignedProducts] No user ID available');
        return [];
      }
      
      console.log('📦 [useAssignedProducts] Fetching assigned products with stock data for user:', user.id);
      
      // Get all product assignments from product_shops table using hr_shop_id
      const { data: productShops, error: productShopsError } = await supabase
        .from('product_shops')
        .select(`
          id,
          product_id,
          hr_shop_id,
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

      console.log('🔍 [useAssignedProducts] Raw product assignments found:', {
        count: productShops.length,
        assignments: productShops.map(ps => ({
          assignmentId: ps.id,
          productName: ps.products?.name,
          hrShopId: ps.hr_shop_id,
          shopId: ps.shop_id
        }))
      });

      // Get today's date for stock queries
      const today = new Date().toISOString().split('T')[0];
      
      // Get yesterday's date for opening stock calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      console.log('📅 [useAssignedProducts] Date range:', { today, yesterday: yesterdayStr });

      // For each assignment, get the current stock data and calculate values
      const assignedProducts: AssignedProduct[] = [];

      for (const assignment of productShops) {
        if (!assignment.products) {
          console.log('⚠️ [useAssignedProducts] Skipping assignment without product data:', assignment.id);
          continue;
        }

        const product = assignment.products;
        
        // Try to get stock data using hr_shop_id first, then fallback to shop_id
        let currentStock = null;
        let yesterdayStock = null;
        
        const shopIdToUse = assignment.hr_shop_id || assignment.shop_id;
        const shopIdField = assignment.hr_shop_id ? 'hr_shop_id' : 'shop_id';
        
        console.log(`📊 [useAssignedProducts] Processing assignment for product "${product.name}":`, {
          assignmentId: assignment.id,
          productId: product.id,
          hrShopId: assignment.hr_shop_id,
          shopId: assignment.shop_id,
          usingField: shopIdField,
          usingValue: shopIdToUse
        });
        
        // Get current stock data for today
        const { data: todayStockData, error: stockError } = await supabase
          .from('stocks')
          .select('*')
          .eq('product_id', product.id)
          .eq(shopIdField, shopIdToUse)
          .eq('stock_date', today)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (stockError) {
          console.error('❌ [useAssignedProducts] Error fetching current stock for product:', product.name, stockError);
        } else {
          currentStock = todayStockData;
          console.log(`📊 [useAssignedProducts] Today's stock for ${product.name}:`, currentStock);
        }

        // Get yesterday's actual stock for opening stock calculation
        const { data: yesterdayStockData, error: yesterdayError } = await supabase
          .from('stocks')
          .select('actual_stock, closing_stock')
          .eq('product_id', product.id)
          .eq(shopIdField, shopIdToUse)
          .eq('stock_date', yesterdayStr)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (yesterdayError) {
          console.error('❌ [useAssignedProducts] Error fetching yesterday stock for product:', product.name, yesterdayError);
        } else {
          yesterdayStock = yesterdayStockData;
          console.log(`📊 [useAssignedProducts] Yesterday's stock for ${product.name}:`, yesterdayStock);
        }

        // Get sales data for today to calculate sold quantity
        const { data: salesData, error: salesError } = await supabase
          .from('bill_items')
          .select(`
            quantity,
            bills!inner(bill_date, user_id)
          `)
          .eq('product_id', product.id)
          .eq('bills.user_id', user?.id)
          .gte('bills.bill_date', today)
          .lt('bills.bill_date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (salesError) {
          console.error('❌ [useAssignedProducts] Error fetching sales for product:', product.name, salesError);
        }

        // Calculate values with corrected logic - actual stock should be user input only
        // Opening stock should be yesterday's actual stock (preferred) or closing stock
        const openingStock = yesterdayStock?.actual_stock ?? yesterdayStock?.closing_stock ?? currentStock?.opening_stock ?? 0;
        const stockAdded = currentStock?.stock_added ?? 0;
        const soldQuantity = salesData?.reduce((total, sale) => total + sale.quantity, 0) ?? 0;
        const expectedClosing = Math.max(0, openingStock + stockAdded - soldQuantity);
        
        // Actual stock should only be set if user has entered it (not auto-calculated)
        const actualStock = currentStock?.actual_stock ?? null;
        
        // Variance only exists when actual stock is entered by user
        const variance = actualStock !== null ? actualStock - expectedClosing : null;

        console.log(`📊 [useAssignedProducts] Calculated values for ${product.name}:`, {
          openingStock,
          stockAdded,
          soldQuantity,
          expectedClosing,
          actualStock: actualStock ?? 'Not entered',
          variance: variance ?? 'N/A'
        });

        // Find the corresponding HR store name
        const hrStore = storesData?.find(store => store.id === shopIdToUse);
        const shopName = hrStore?.store_name || 'Unknown Store';

        console.log(`🏪 [useAssignedProducts] Store mapping for ${product.name}:`, {
          shopIdToUse,
          foundStore: hrStore?.store_name,
          finalShopName: shopName
        });

        const assignedProduct: AssignedProduct = {
          assignment_id: assignment.id,
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost_price: product.cost_price,
          opening_stock: openingStock,
          stock_added: stockAdded,
          sold_quantity: soldQuantity,
          expected_closing: expectedClosing,
          actual_stock: actualStock,
          variance: variance,
          last_stock_date: currentStock?.stock_date ?? null,
          shop_id: shopIdToUse,
          shop_name: shopName
        };

        assignedProducts.push(assignedProduct);
      }

      console.log('✅ [useAssignedProducts] Final assigned products with stock:', {
        count: assignedProducts.length,
        productsByStore: assignedProducts.reduce((acc, product) => {
          if (!acc[product.shop_name]) {
            acc[product.shop_name] = [];
          }
          acc[product.shop_name].push(product.name);
          return acc;
        }, {} as Record<string, string[]>)
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

  return {
    assignedProducts: assignedProductsData || [],
    loading: storesLoading || productsLoading,
    shops: stores,
    products: uniqueProducts
  };
};
