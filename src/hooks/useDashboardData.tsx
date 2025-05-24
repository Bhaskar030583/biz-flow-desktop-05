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
  creditGiven: number;
  creditReceived: number;
  creditBalance: number;
  grossProfit: number;
  netProfit: number;
  totalLoss: number;
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
    stockEntries: [],
    creditGiven: 0,
    creditReceived: 0,
    creditBalance: 0,
    grossProfit: 0,
    netProfit: 0,
    totalLoss: 0
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

        // Fetch credit data (given and received)
        let creditQuery = supabase.from("credits").select(`
          credit_type,
          amount,
          credit_date
        `)
        .in('credit_type', ['given', 'received']);

        // Apply date filters to credits
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          creditQuery = creditQuery.gte("credit_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          creditQuery = creditQuery.lte("credit_date", formattedEndDate);
        }
        
        // Apply shop filter to credits
        if (selectedShops && selectedShops.length > 0) {
          creditQuery = creditQuery.in("shop_id", selectedShops);
        }

        const { data: creditData, error: creditError } = await creditQuery;
        
        if (creditError) throw creditError;

        // Calculate credit totals
        let creditGiven = 0;
        let creditReceived = 0;

        creditData?.forEach((item) => {
          if (item.credit_type === 'given') {
            creditGiven += Number(item.amount) || 0;
          } else if (item.credit_type === 'received') {
            creditReceived += Number(item.amount) || 0;
          }
        });

        const creditBalance = creditReceived - creditGiven;
        
        // Fetch sales data with cost_price for profit calculation
        let salesQuery = supabase
          .from("sales")
          .select(`
            quantity,
            price,
            sale_date,
            products(id, name, price, cost_price, category)
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
        
        // Calculate sales metrics and profit/loss
        let totalSales = 0;
        let totalProducts = 0;
        let totalRevenue = 0;
        let grossProfit = 0;
        let totalLoss = 0;
        
        filteredSales?.forEach((sale) => {
          totalSales++;
          const quantity = Number(sale.quantity) || 0;
          const sellingPrice = Number(sale.price) || 0;
          const costPrice = Number(sale.products?.cost_price) || 0;
          
          totalProducts += quantity;
          totalRevenue += (sellingPrice * quantity);
          
          // Calculate gross profit (selling price - cost price) * quantity
          const profitPerUnit = sellingPrice - costPrice;
          const totalProfitForSale = profitPerUnit * quantity;
          
          if (totalProfitForSale > 0) {
            grossProfit += totalProfitForSale;
          } else {
            totalLoss += Math.abs(totalProfitForSale);
          }
        });

        // Calculate net profit (gross profit - credit given + credit received)
        const netProfit = grossProfit - creditGiven + creditReceived;
        
        // Update state with all data
        setData({
          totalSales,
          totalProducts,
          totalRevenue,
          cashAmount,
          cardAmount,
          onlineAmount,
          stockEntries: data.stockEntries,
          creditGiven,
          creditReceived,
          creditBalance,
          grossProfit,
          netProfit,
          totalLoss
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
