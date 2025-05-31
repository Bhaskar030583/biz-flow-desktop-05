
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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Get products assigned to this HR store from product_shops
      const { data: productShops, error: productShopsError } = await supabase
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
        .or(`hr_shop_id.eq.${selectedStoreId},shop_id.eq.${selectedStoreId}`)
        .eq('user_id', user?.id);
      
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

      // Get today's stock data
      const { data: todayStockData, error: todayStockError } = await supabase
        .from('stocks')
        .select('product_id, opening_stock, stock_added, actual_stock')
        .or(`hr_shop_id.eq.${selectedStoreId},shop_id.eq.${selectedStoreId}`)
        .eq('user_id', user?.id)
        .eq('stock_date', today)
        .in('product_id', productIds);
      
      if (todayStockError) {
        console.error('❌ [POS] Error fetching today stock data:', todayStockError);
      }

      // Get yesterday's stock data for opening stock calculation
      const { data: yesterdayStockData, error: yesterdayStockError } = await supabase
        .from('stocks')
        .select('product_id, actual_stock, closing_stock')
        .or(`hr_shop_id.eq.${selectedStoreId},shop_id.eq.${selectedStoreId}`)
        .eq('user_id', user?.id)
        .eq('stock_date', yesterdayStr)
        .in('product_id', productIds);
      
      if (yesterdayStockError) {
        console.error('❌ [POS] Error fetching yesterday stock data:', yesterdayStockError);
      }

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
        
        // Calculate based on new requirements
        // Opening stock = yesterday's actual stock OR current stock's opening stock
        const openingStock = (yesterdayStock?.actual_stock ?? todayStock?.opening) || 0;
        const stockAdded = todayStock?.added || 0;
        
        // Expected closing = Opening Stock + Stock Added - Sold
        const expectedClosing = Math.max(0, openingStock + stockAdded - soldToday);
        
        // Available quantity for POS = Expected Closing (what should be available to sell)
        const availableQuantity = expectedClosing;

        console.log(`📊 [POS] Product ${product.name}:`, {
          openingStock,
          stockAdded,
          soldToday,
          expectedClosing,
          availableQuantity,
          calculation: `${openingStock} + ${stockAdded} - ${soldToday} = ${expectedClosing}`
        });

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: availableQuantity,
          expectedClosing: expectedClosing
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
          table: 'stocks',
          filter: `hr_shop_id=eq.${selectedStoreId}`
        },
        (payload) => {
          console.log('📡 [POS] Real-time stock change detected:', payload);
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
