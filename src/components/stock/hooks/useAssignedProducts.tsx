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

  // Fetch assigned products with current stock data using both hr_shop_id and shop_id
  const { data: assignedProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['assigned-products-with-stock', refreshTrigger],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ [useAssignedProducts] No user ID available');
        return [];
      }
      
      console.log('📦 [useAssignedProducts] Fetching assigned products with stock data for user:', user.id);
      
      // Get all product assignments from product_shops table using both hr_shop_id and shop_id
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
        
        // Get current stock data for today - check both hr_shop_id and shop_id
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

        console.log(`🔍 [useAssignedProducts] Final current stock for ${product.name}:`, {
          found: !!currentStock,
          data: currentStock,
          actualStockValue: currentStock?.actual_stock,
          actualStockType: typeof currentStock?.actual_stock
        });

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

        // Calculate values properly
        const openingStock = yesterdayStock?.actual_stock ?? yesterdayStock?.closing_stock ?? currentStock?.opening_stock ?? 0;
        const stockAdded = currentStock?.stock_added ?? 0;
        const soldQuantity = salesData?.reduce((total, sale) => total + sale.quantity, 0) ?? 0;
        const expectedClosing = Math.max(0, openingStock + stockAdded - soldQuantity);
        
        // FIXED: Directly use actual_stock from database, don't override it
        let actualStock = 0;
        if (currentStock && currentStock.actual_stock !== null && currentStock.actual_stock !== undefined) {
          // Use the actual stock value from database as-is
          actualStock = currentStock.actual_stock;
          console.log(`✅ [useAssignedProducts] Using actual_stock from DB for ${product.name}: ${actualStock}`);
        } else if (currentStock) {
          // If we have a stock record but no actual_stock value, use expected closing
          actualStock = expectedClosing;
          console.log(`⚠️ [useAssignedProducts] No actual_stock in DB for ${product.name}, using expected: ${actualStock}`);
        } else {
          // No stock record at all
          actualStock = 0;
          console.log(`❌ [useAssignedProducts] No stock record for ${product.name}, using 0`);
        }
        
        // Variance calculation - only meaningful when we have a stock record
        const variance = currentStock ? (actualStock - expectedClosing) : 0;

        console.log(`📊 [useAssignedProducts] Final calculated values for ${product.name}:`, {
          openingStock,
          stockAdded,
          soldQuantity,
          expectedClosing,
          actualStock,
          actualStockFromDB: currentStock?.actual_stock,
          variance,
          hasStockRecord: !!currentStock,
          currentStockData: currentStock
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
          acc[product.shop_name].push({
            name: product.name,
            actualStock: product.actual_stock,
            stockAdded: product.stock_added
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
