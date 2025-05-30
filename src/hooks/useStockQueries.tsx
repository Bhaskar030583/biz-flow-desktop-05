import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from 'date-fns';

export interface StockEntry {
  id: string;
  stock_date: string;
  opening_stock: number;
  closing_stock: number;
  actual_stock: number;
  stock_added?: number;
  operator_name?: string;
  hr_stores?: { id: string; store_name: string };
  products?: { id: string; name: string; price: number; cost_price: number | null };
}

interface UseStockParams {
  searchTerm?: string;
  shopFilter?: string;
  productFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export const useStockQueries = ({
  searchTerm = '',
  shopFilter = '',
  productFilter = '',
  dateFrom = subDays(new Date(), 30),
  dateTo = new Date(),
  page = 1,
  pageSize = 50
}: UseStockParams = {}) => {
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<string>("stock_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Convert dates to ISO format for the database query
  const fromDate = format(dateFrom, 'yyyy-MM-dd');
  const toDate = format(dateTo, 'yyyy-MM-dd');

  // Fetch stock entries with pagination
  const {
    data: stockData,
    isLoading: isLoadingStock,
    error: stockError,
    refetch: refetchStock
  } = useQuery({
    queryKey: ['stocks', fromDate, toDate, page, pageSize, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from("stocks")
        .select(`
          id, 
          stock_date, 
          opening_stock, 
          closing_stock, 
          actual_stock,
          stock_added,
          operator_name,
          hr_stores!stocks_hr_shop_id_fkey (id, store_name),
          products (id, name, price, cost_price)
        `)
        .gte('stock_date', fromDate)
        .lte('stock_date', toDate);

      // Apply sorting
      if (sortField === 'stock_date') {
        query = query.order('stock_date', { ascending: sortDirection === 'asc' });
      } else {
        // Default sort by date as secondary sort
        query = query.order('stock_date', { ascending: false });
      }

      // Apply pagination if required
      if (page && pageSize) {
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { 
        entries: data || [], 
        totalCount: count || 0 
      };
    }
  });

  // Fetch HRMS stores and product options for filters
  const { 
    data: filterOptions,
    isLoading: isLoadingFilters 
  } = useQuery({
    queryKey: ['stock-filter-options'],
    queryFn: async () => {
      // Fetch HRMS stores instead of shops
      const { data: hrStores, error: storesError } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (storesError) throw storesError;

      // Transform to match expected format
      const shops = hrStores?.map(store => ({
        id: store.id,
        name: store.store_name
      })) || [];

      // Fetch unique products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
      
      if (productsError) throw productsError;

      return { shops, products: products || [] };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Process the entries locally based on search term and filters
  const processedEntries = stockData?.entries.filter(entry => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      entry.products?.name?.toLowerCase().includes(searchLower) ||
      entry.hr_stores?.store_name?.toLowerCase().includes(searchLower) ||
      entry.operator_name?.toLowerCase().includes(searchLower);
      
    // Shop filter - handle both empty string and "_all" as "show all"
    const matchesShop = !shopFilter || shopFilter === "_all" || entry.hr_stores?.id === shopFilter;
    
    // Product filter - handle both empty string and "_all" as "show all"
    const matchesProduct = !productFilter || productFilter === "_all" || entry.products?.id === productFilter;
    
    return matchesSearch && matchesShop && matchesProduct;
  }) || [];

  // Handle sorting that can't be done at the database level
  const sortEntries = (entries: StockEntry[]) => {
    if (sortField === "stock_date") {
      // Already sorted at DB level
      return entries;
    }
    
    return [...entries].sort((a, b) => {
      if (sortField === "units_sold") {
        const soldA = a.opening_stock - a.closing_stock;
        const soldB = b.opening_stock - b.closing_stock;
        return sortDirection === "asc" ? soldA - soldB : soldB - soldA;
      }
      
      if (sortField === "sales_amount") {
        const salesA = (a.opening_stock - a.closing_stock) * Number(a.products?.price || 0);
        const salesB = (b.opening_stock - b.closing_stock) * Number(b.products?.price || 0);
        return sortDirection === "asc" ? salesA - salesB : salesB - salesA;
      }
      
      if (sortField === "profit") {
        const profitA = calculateProfit(a);
        const profitB = calculateProfit(b);
        return sortDirection === "asc" ? profitA - profitB : profitB - profitA;
      }
      
      return 0;
    });
  };

  // Calculate profit for a stock entry
  const calculateProfit = (entry: StockEntry) => {
    const sold = entry.opening_stock - entry.closing_stock;
    const sales = sold * Number(entry.products?.price || 0);
    const cost = sold * Number(entry.products?.cost_price || 0);
    return sales - cost;
  };

  // Calculate summary metrics
  const calculateSummary = (entries: StockEntry[]) => {
    if (!entries.length) return { totalSold: 0, totalSales: 0, totalProfit: 0 };
    
    return entries.reduce((acc, entry) => {
      const sold = entry.opening_stock - entry.closing_stock;
      const sales = sold * Number(entry.products?.price || 0);
      const profit = calculateProfit(entry);
      
      return {
        totalSold: acc.totalSold + sold,
        totalSales: acc.totalSales + sales,
        totalProfit: acc.totalProfit + profit
      };
    }, { totalSold: 0, totalSales: 0, totalProfit: 0 });
  };

  // Enhanced refetch function that also invalidates POS queries
  const enhancedRefetch = () => {
    // Invalidate POS queries to refresh stock data
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
    
    return refetchStock();
  };

  // Handle sorting change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Apply local sorting
  const sortedEntries = sortEntries(processedEntries);
  // Calculate summary based on filtered entries
  const summary = calculateSummary(processedEntries);
  
  return {
    entries: sortedEntries,
    filteredCount: processedEntries.length,
    totalCount: stockData?.totalCount || 0,
    summary,
    filterOptions,
    isLoading: isLoadingStock || isLoadingFilters,
    error: stockError,
    sortField,
    sortDirection,
    handleSortChange,
    calculateProfit,
    refetch: enhancedRefetch
  };
};

// Utility hook for debouncing inputs
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};
