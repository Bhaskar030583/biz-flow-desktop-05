
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
        
        // Use both hr_shop_id and shop_id to find stock data
        const shopIdToUse = assignment.hr_shop_id || assignment.shop_id;
        
        console.log(`📊 [useAssignedProducts] Processing assignment for product "${product.name}":`, {
          assignmentId: assignment.id,
          productId: product.id,
          hrShopId: assignment.hr_shop_id,
          shopId: assignment.shop_id,
          usingShopId: shopIdToUse
        });
        
        // Get current stock data for today
        let currentStock = null;
        
        // First try with hr_shop_id if available
        if (assignment.hr_shop_id) {
          const { data: hrStockData, error: hrStockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('product_id', product.id)
            .eq('hr_shop_id', assignment.hr_shop_id)
            .eq('stock_date', today)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (hrStockError) {
            console.error('❌ [useAssignedProducts] Error fetching HR stock for product:', product.name, hrStockError);
          } else if (hrStockData) {
            currentStock = hrStockData;
            console.log(`📊 [useAssignedProducts] Found HR stock for ${product.name}:`, currentStock);
          }
        }
        
        // If no HR stock found, try with shop_id
        if (!currentStock && assignment.shop_id) {
          const { data: shopStockData, error: shopStockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('product_id', product.id)
            .eq('shop_id', assignment.shop_id)
            .eq('stock_date', today)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (shopStockError) {
            console.error('❌ [useAssignedProducts] Error fetching shop stock for product:', product.name, shopStockError);
          } else if (shopStockData) {
            currentStock = shopStockData;
            console.log(`📊 [useAssignedProducts] Found shop stock for ${product.name}:`, currentStock);
          }
        }

        // Get yesterday's actual stock for opening stock calculation
        let yesterdayStock = null;
        
        // First try with hr_shop_id if available
        if (assignment.hr_shop_id) {
          const { data: hrYesterdayData, error: hrYesterdayError } = await supabase
            .from('stocks')
            .select('actual_stock, closing_stock')
            .eq('product_id', product.id)
            .eq('hr_shop_id', assignment.hr_shop_id)
            .eq('stock_date', yesterdayStr)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (hrYesterdayError) {
            console.error('❌ [useAssignedProducts] Error fetching HR yesterday stock for product:', product.name, hrYesterdayError);
          } else if (hrYesterdayData) {
            yesterdayStock = hrYesterdayData;
          }
        }
        
        // If no HR yesterday stock found, try with shop_id
        if (!yesterdayStock && assignment.shop_id) {
          const { data: shopYesterdayData, error: shopYesterdayError } = await supabase
            .from('stocks')
            .select('actual_stock, closing_stock')
            .eq('product_id', product.id)
            .eq('shop_id', assignment.shop_id)
            .eq('stock_date', yesterdayStr)
            .eq('user_id', user?.id)
            .maybeSingle();

          if (shopYesterdayError) {
            console.error('❌ [useAssignedProducts] Error fetching shop yesterday stock for product:', product.name, shopYesterdayError);
          } else if (shopYesterdayData) {
            yesterdayStock = shopYesterdayData;
          }
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

        // Calculate values based on the new requirements
        // Opening stock = yesterday's actual stock OR current stock's opening stock (for new assignments)
        const openingStock = yesterdayStock?.actual_stock ?? currentStock?.opening_stock ?? 0;
        
        // Stock added from current record
        const stockAdded = currentStock?.stock_added ?? 0;
        
        // Total sold quantity for today
        const soldQuantity = salesData?.reduce((total, sale) => total + sale.quantity, 0) ?? 0;
        
        // Expected closing = Opening Stock + Stock Added - Sold
        const expectedClosing = Math.max(0, openingStock + stockAdded - soldQuantity);
        
        // Actual stock - use the value from database if manually updated, otherwise use expected closing
        let actualStock = expectedClosing; // Default to expected closing
        
        if (currentStock && currentStock.actual_stock !== null && currentStock.actual_stock !== undefined) {
          // If actual stock was manually updated, use that value
          actualStock = currentStock.actual_stock;
          console.log(`✅ [useAssignedProducts] Using manually updated actual_stock for ${product.name}: ${actualStock}`);
        } else {
          // If not manually updated, actual stock equals expected closing
          console.log(`📊 [useAssignedProducts] Using calculated actual_stock for ${product.name}: ${actualStock}`);
        }
        
        // Variance = Actual Stock - Expected Closing
        const variance = actualStock - expectedClosing;

        console.log(`📊 [useAssignedProducts] Final calculated values for ${product.name}:`, {
          openingStock,
          stockAdded,
          soldQuantity,
          expectedClosing,
          actualStock,
          actualStockFromDB: currentStock?.actual_stock,
          variance,
          hasStockRecord: !!currentStock,
          calculation: `${openingStock} + ${stockAdded} - ${soldQuantity} = ${expectedClosing}`
        });

        // Find the corresponding HR store name
        const hrStore = storesData?.find(store => store.id === shopIdToUse);
        const shopName = hrStore?.store_name || 'Unknown Store';

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

      console.log('✅ [useAssignedProducts] Final assigned products with calculated stock:', {
        count: assignedProducts.length,
        productsByStore: assignedProducts.reduce((acc, product) => {
          if (!acc[product.shop_name]) {
            acc[product.shop_name] = [];
          }
          acc[product.shop_name].push({
            name: product.name,
            openingStock: product.opening_stock,
            stockAdded: product.stock_added,
            soldQuantity: product.sold_quantity,
            expectedClosing: product.expected_closing,
            actualStock: product.actual_stock,
            variance: product.variance
          });
          return acc;
        }, {} as Record<string, any[]>)
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
