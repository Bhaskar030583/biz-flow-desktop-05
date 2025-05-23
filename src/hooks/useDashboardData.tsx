
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  totalSales: number;
  totalProducts: number;
  totalRevenue: number;
  cashAmount: number;
  cardAmount: number;
  onlineAmount: number;
  stockEntries: any[];
}

export const useDashboardData = (
  startDate: Date | null,
  endDate: Date | null,
  selectedShops: string[],
  selectedCategory: string | null,
  selectedProduct: string | null
) => {
  const [data, setData] = useState<DashboardData>({
    totalSales: 0,
    totalProducts: 0,
    totalRevenue: 0,
    cashAmount: 0,
    cardAmount: 0,
    onlineAmount: 0,
    stockEntries: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);

  useEffect(() => {
    async function fetchSummaryData() {
      try {
        setIsLoading(true);
        // Fetch collection data for payment methods
        let collectionQuery = supabase.from("credits").select(`
          credit_type,
          amount,
          credit_date
        `)
        .in('credit_type', ['cash', 'card', 'online']);
        
        // Apply date filters to collections
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          collectionQuery = collectionQuery.gte("credit_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          collectionQuery = collectionQuery.lte("credit_date", formattedEndDate);
        }
        
        // Apply shop filter to collections
        if (selectedShops && selectedShops.length > 0) {
          collectionQuery = collectionQuery.in("shop_id", selectedShops);
        }
        
        const { data: collectionData, error: collectionError } = await collectionQuery;
        
        if (collectionError) throw collectionError;
        
        // Calculate totals for payment methods
        let cashAmount = 0;
        let cardAmount = 0;
        let onlineAmount = 0;
        
        collectionData?.forEach((item) => {
          if (item.credit_type === 'cash') {
            cashAmount += Number(item.amount) || 0;
          } else if (item.credit_type === 'card') {
            cardAmount += Number(item.amount) || 0;
          } else if (item.credit_type === 'online') {
            onlineAmount += Number(item.amount) || 0;
          }
        });
        
        // Fetch sales data
        let salesQuery = supabase
          .from("sales")
          .select(`
            quantity,
            price,
            sale_date,
            products(id, name, price, category)
          `);
        
        // Apply date filters to sales
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          salesQuery = salesQuery.gte("sale_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          salesQuery = salesQuery.lte("sale_date", formattedEndDate);
        }
        
        // Apply shop filter to sales
        if (selectedShops && selectedShops.length > 0) {
          salesQuery = salesQuery.in("shop_id", selectedShops);
        }
        
        // Apply product filter
        if (selectedProduct) {
          salesQuery = salesQuery.eq("product_id", selectedProduct);
        }
        
        const { data: salesData, error: salesError } = await salesQuery;
        
        if (salesError) throw salesError;
        
        // Filter by category if needed
        const filteredSales = selectedCategory
          ? salesData?.filter((sale) => sale.products?.category === selectedCategory)
          : salesData;
        
        // Calculate sales metrics
        let totalSales = 0;
        let totalProducts = 0;
        let totalRevenue = 0;
        
        filteredSales?.forEach((sale) => {
          totalSales++;
          totalProducts += Number(sale.quantity) || 0;
          totalRevenue += (Number(sale.price) * Number(sale.quantity)) || 0;
        });

        // Update state with all data
        setData({
          totalSales,
          totalProducts,
          totalRevenue,
          cashAmount,
          cardAmount,
          onlineAmount,
          stockEntries: data.stockEntries
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    async function fetchStockData() {
      try {
        setIsLoadingStock(true);
        
        // Build the query to fetch stock data
        let query = supabase
          .from("stocks")
          .select(`
            id, 
            stock_date, 
            opening_stock, 
            closing_stock, 
            actual_stock,
            products (id, name, price, cost_price),
            shops (id, name)
          `);
        
        // Apply date filters
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          query = query.gte("stock_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          query = query.lte("stock_date", formattedEndDate);
        }
        
        // Apply shop filter
        if (selectedShops && selectedShops.length > 0) {
          query = query.in("shop_id", selectedShops);
        }
        
        // Apply product filter
        if (selectedProduct) {
          query = query.eq("product_id", selectedProduct);
        }
        
        const { data: stockData, error } = await query;
        
        if (error) throw error;
        
        // Update state with stock data
        setData(prevData => ({
          ...prevData,
          stockEntries: stockData || []
        }));
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setIsLoadingStock(false);
      }
    }
    
    fetchSummaryData();
    fetchStockData();
  }, [startDate, endDate, selectedShops, selectedCategory, selectedProduct]);

  return { data, isLoading, isLoadingStock };
};
