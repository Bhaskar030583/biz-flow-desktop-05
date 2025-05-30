
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
}

export const usePOSProducts = (selectedStoreId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['pos-products', selectedStoreId],
    queryFn: async (): Promise<Product[]> => {
      if (!selectedStoreId) {
        console.log('🔍 [POS] No store selected for product query');
        return [];
      }
      
      console.log('🔍 [POS] Fetching products for HRMS store:', selectedStoreId);
      const today = new Date().toISOString().split('T')[0];
      
      // Get products assigned to this HR store from product_shops using hr_shop_id
      const { data: productShops, error: productShopsError } = await supabase
        .from('product_shops')
        .select(`
          products (
            id,
            name,
            price,
            category
          )
        `)
        .eq('hr_shop_id', selectedStoreId)
        .eq('user_id', user?.id);
      
      if (productShopsError) {
        console.error('❌ [POS] Error fetching product_shops:', productShopsError);
        throw productShopsError;
      }

      console.log('📦 [POS] Product shops result:', productShops);

      // Only show assigned products - no fallback to all products
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

      // Try to get stock data using both hr_shop_id and shop_id to handle different storage methods
      console.log('📊 [POS] Attempting to fetch stock data for store:', selectedStoreId);
      
      // First try with hr_shop_id
      let { data: stockData, error: stockError } = await supabase
        .from('stocks')
        .select('product_id, opening_stock, stock_added')
        .eq('hr_shop_id', selectedStoreId)
        .eq('user_id', user?.id)
        .eq('stock_date', today)
        .in('product_id', productIds);
      
      // If no data found with hr_shop_id, try with shop_id
      if (stockError || !stockData || stockData.length === 0) {
        console.log('📊 [POS] No stock found with hr_shop_id, trying shop_id...');
        const shopIdResult = await supabase
          .from('stocks')
          .select('product_id, opening_stock, stock_added')
          .eq('shop_id', selectedStoreId)
          .eq('user_id', user?.id)
          .eq('stock_date', today)
          .in('product_id', productIds);
        
        if (!shopIdResult.error) {
          stockData = shopIdResult.data;
          console.log('📊 [POS] Found stock data using shop_id:', stockData);
        }
      }
      
      if (stockError && !stockData) {
        console.error('❌ [POS] Error fetching stock data:', stockError);
        // Don't throw error, just log it and continue with zero stock
      }

      console.log('📊 [POS] Final stock data:', stockData);

      // Get today's sales data to calculate sold quantity
      const { data: salesData, error: salesError } = await supabase
        .from('bill_items')
        .select(`
          product_id,
          quantity,
          bills!inner(bill_date, user_id)
        `)
        .eq('bills.user_id', user?.id)
        .gte('bills.bill_date', today)
        .lt('bills.bill_date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .in('product_id', productIds);

      if (salesError) {
        console.error('❌ [POS] Error fetching sales data:', salesError);
      }

      console.log('💰 [POS] Sales data for today:', salesData);

      // Create maps for quick lookup
      const stockMap = new Map();
      stockData?.forEach(stock => {
        stockMap.set(stock.product_id, {
          opening: stock.opening_stock || 0,
          added: stock.stock_added || 0
        });
      });

      // Calculate total sales for each product today
      const salesMap = new Map();
      salesData?.forEach(sale => {
        const currentSales = salesMap.get(sale.product_id) || 0;
        salesMap.set(sale.product_id, currentSales + sale.quantity);
      });

      // Combine product data with calculated Expected Closing stock
      const productsWithStock = allProducts.map(product => {
        const stockInfo = stockMap.get(product.id);
        const soldToday = salesMap.get(product.id) || 0;
        
        let expectedClosing = 0;
        
        if (stockInfo) {
          // Calculate Expected Closing: Opening Stock + Stock Added - Sold
          expectedClosing = Math.max(0, (stockInfo.opening + stockInfo.added) - soldToday);
          console.log(`📊 [POS] Product ${product.name}: Expected Closing = (${stockInfo.opening} + ${stockInfo.added}) - ${soldToday} = ${expectedClosing}`);
        } else {
          console.log(`⚠️ [POS] No stock info found for product ${product.name} (ID: ${product.id})`);
        }

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: expectedClosing // Use Expected Closing as available quantity
        };
      });

      console.log('✅ [POS] Final products with Expected Closing stock:', productsWithStock);
      return productsWithStock;
    },
    enabled: !!selectedStoreId && !!user?.id,
    refetchInterval: 5000, // Check every 5 seconds for stock updates
    staleTime: 2000, // Consider data stale after 2 seconds
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
          table: 'stocks',
          filter: `hr_shop_id=eq.${selectedStoreId}`
        },
        (payload) => {
          console.log('📡 [POS] Real-time stock change detected:', payload);
          // Invalidate and refetch products to get updated stock
          queryClient.invalidateQueries({ queryKey: ['pos-products', selectedStoreId] });
          refetchProducts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks',
          filter: `shop_id=eq.${selectedStoreId}`
        },
        (payload) => {
          console.log('📡 [POS] Real-time stock change detected (shop_id):', payload);
          // Invalidate and refetch products to get updated stock
          queryClient.invalidateQueries({ queryKey: ['pos-products', selectedStoreId] });
          refetchProducts();
        }
      )
      .subscribe();

    // Also listen for bill changes (sales) to update stock in real-time
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
          // Refetch products to reflect new sales
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
    // Invalidate and refresh all relevant queries
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
    
    // Also directly refetch this specific query
    refetchProducts();
  };

  return {
    products,
    productsLoading,
    refetchProducts,
    handleStockAdded
  };
};
