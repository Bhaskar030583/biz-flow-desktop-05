
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  expectedClosing?: number;
  actualStock?: number;
  openingStock?: number;
  stockAdded?: number;
  soldToday?: number;
}

export const usePOSProducts = (selectedStoreId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['pos-products', selectedStoreId],
    queryFn: async (): Promise<Product[]> => {
      if (!selectedStoreId || !user?.id) {
        console.log('🔍 [POS] No store selected or user not authenticated');
        return [];
      }
      
      console.log('🔍 [POS] Fetching products for store:', selectedStoreId);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if selectedStoreId is a UUID or a string identifier
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedStoreId);
      
      let productShops;
      let productShopsError;
      
      if (isUUID) {
        // Try hr_shop_id first for UUID
        console.log('🔍 [POS] Querying with UUID hr_shop_id:', selectedStoreId);
        const result = await supabase
          .from('product_shops')
          .select(`
            products (
              id,
              name,
              price,
              category
            ),
            hr_shop_id,
            shop_id
          `)
          .eq('hr_shop_id', selectedStoreId)
          .eq('user_id', user.id);
        
        productShops = result.data;
        productShopsError = result.error;
        
        // If no results with hr_shop_id, try shop_id
        if (!productShopsError && (!productShops || productShops.length === 0)) {
          console.log('🔍 [POS] No results with hr_shop_id, trying shop_id');
          const fallbackResult = await supabase
            .from('product_shops')
            .select(`
              products (
                id,
                name,
                price,
                category
              ),
              hr_shop_id,
              shop_id
            `)
            .eq('shop_id', selectedStoreId)
            .eq('user_id', user.id);
          
          productShops = fallbackResult.data;
          productShopsError = fallbackResult.error;
        }
      } else {
        // For string identifiers, try to find in hr_stores first
        console.log('🔍 [POS] Querying with string identifier:', selectedStoreId);
        
        // First, try to find the store by name or code in hr_stores
        const { data: hrStores, error: hrStoresError } = await supabase
          .from('hr_stores')
          .select('id, store_name, store_code')
          .or(`store_name.ilike.%${selectedStoreId}%,store_code.ilike.%${selectedStoreId}%`);
        
        if (!hrStoresError && hrStores && hrStores.length > 0) {
          const storeId = hrStores[0].id;
          console.log('🔍 [POS] Found HR store:', storeId);
          
          const result = await supabase
            .from('product_shops')
            .select(`
              products (
                id,
                name,
                price,
                category
              ),
              hr_shop_id,
              shop_id
            `)
            .eq('hr_shop_id', storeId)
            .eq('user_id', user.id);
          
          productShops = result.data;
          productShopsError = result.error;
        } else {
          // Fallback to legacy shops table
          console.log('🔍 [POS] Trying legacy shops table with string identifier');
          const result = await supabase
            .from('product_shops')
            .select(`
              products (
                id,
                name,
                price,
                category
              ),
              hr_shop_id,
              shop_id
            `)
            .eq('user_id', user.id);
          
          productShops = result.data;
          productShopsError = result.error;
        }
      }
      
      if (productShopsError) {
        console.error('❌ [POS] Error fetching product_shops:', productShopsError);
        throw productShopsError;
      }

      console.log('📦 [POS] Product shops result:', productShops);

      const allProducts = productShops
        ?.map(item => item.products)
        .filter(product => product !== null) || [];

      console.log('📦 [POS] Products to process:', allProducts);

      if (allProducts.length === 0) {
        console.log('⚠️ [POS] No products assigned to this store');
        return [];
      }

      // Get product IDs
      const productIds = allProducts.map(product => product.id);

      // For stock data, use the actual store ID (UUID if available)
      let actualStoreId = selectedStoreId;
      if (!isUUID) {
        // Try to get the actual UUID from hr_stores
        const { data: hrStores } = await supabase
          .from('hr_stores')
          .select('id')
          .or(`store_name.ilike.%${selectedStoreId}%,store_code.ilike.%${selectedStoreId}%`)
          .limit(1);
        
        if (hrStores && hrStores.length > 0) {
          actualStoreId = hrStores[0].id;
        }
      }

      // Get today's stock data
      const { data: todayStockData } = await supabase
        .from('stocks')
        .select('product_id, opening_stock, stock_added, actual_stock')
        .eq('hr_shop_id', actualStoreId)
        .eq('user_id', user.id)
        .eq('stock_date', today)
        .in('product_id', productIds);

      // Get yesterday's stock data for opening stock calculation
      const { data: yesterdayStockData } = await supabase
        .from('stocks')
        .select('product_id, actual_stock, closing_stock')
        .eq('hr_shop_id', actualStoreId)
        .eq('user_id', user.id)
        .eq('stock_date', yesterdayStr)
        .in('product_id', productIds);

      // Get today's sales data to calculate sold quantity
      const { data: salesData, error: salesError } = await supabase
        .from('bill_items')
        .select(`
          product_id,
          quantity,
          bills!inner(bill_date, user_id)
        `)
        .eq('bills.user_id', user.id)
        .gte('bills.bill_date', today)
        .lt('bills.bill_date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .in('product_id', productIds);

      if (salesError) {
        console.error('❌ [POS] Error fetching sales data:', salesError);
      }

      // Create maps for quick lookup
      const todayStockMap = new Map();
      todayStockData?.forEach(stock => {
        todayStockMap.set(stock.product_id, {
          opening: stock.opening_stock || 0,
          added: stock.stock_added || 0,
          actual: stock.actual_stock
        });
      });

      const yesterdayStockMap = new Map();
      yesterdayStockData?.forEach(stock => {
        yesterdayStockMap.set(stock.product_id, {
          actual: stock.actual_stock,
          closing: stock.closing_stock
        });
      });

      // Calculate total sales for each product today
      const salesMap = new Map();
      salesData?.forEach(sale => {
        const currentSales = salesMap.get(sale.product_id) || 0;
        salesMap.set(sale.product_id, currentSales + sale.quantity);
      });

      // Combine product data with calculated available stock for POS
      const productsWithStock = allProducts.map(product => {
        const todayStock = todayStockMap.get(product.id);
        const yesterdayStock = yesterdayStockMap.get(product.id);
        const soldToday = salesMap.get(product.id) || 0;
        
        // Calculate based on requirements
        const openingStock = (yesterdayStock?.actual_stock ?? todayStock?.opening) || 0;
        const stockAdded = todayStock?.added || 0;
        
        // Expected closing = Opening Stock + Stock Added - Sold
        const expectedClosing = Math.max(0, openingStock + stockAdded - soldToday);
        
        // Actual stock = from database if available, otherwise equals expected closing
        let actualStock = expectedClosing;
        
        if (todayStock?.actual !== null && todayStock?.actual !== undefined) {
          actualStock = todayStock.actual;
        }

        console.log(`📊 [POS] Product ${product.name}:`, {
          openingStock,
          stockAdded,
          soldToday,
          expectedClosing,
          actualStock,
          calculation: `${openingStock} + ${stockAdded} - ${soldToday} = ${expectedClosing}`
        });

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: expectedClosing, // For POS display (Expected Closing)
          expectedClosing: expectedClosing,
          actualStock: actualStock,
          openingStock: openingStock,
          stockAdded: stockAdded,
          soldToday: soldToday
        };
      });

      console.log('✅ [POS] Final products with calculated stock:', productsWithStock);
      return productsWithStock;
    },
    enabled: !!selectedStoreId && !!user?.id,
    refetchInterval: 5000,
    staleTime: 2000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Set up real-time listener for stock changes
  useEffect(() => {
    if (!selectedStoreId || !user?.id) return;

    console.log('📡 [POS] Setting up real-time stock listener for store:', selectedStoreId);
    
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks'
        },
        (payload) => {
          console.log('📡 [POS] Real-time stock change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['pos-products', selectedStoreId] });
          refetchProducts();
        }
      )
      .subscribe();

    const billChannel = supabase
      .channel('bill-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bills'
        },
        (payload) => {
          console.log('📡 [POS] Real-time sale detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['pos-products', selectedStoreId] });
          refetchProducts();
        }
      )
      .subscribe();

    return () => {
      console.log('📡 [POS] Cleaning up real-time listeners');
      supabase.removeChannel(channel);
      supabase.removeChannel(billChannel);
    };
  }, [selectedStoreId, user?.id, queryClient, refetchProducts]);

  const handleStockAdded = () => {
    console.log('🔄 [POS] Stock updated, refreshing product data');
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
    
    refetchProducts();
  };

  return {
    products,
    productsLoading,
    refetchProducts,
    handleStockAdded
  };
};
