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
  selectedProduct: string | null,
  paymentMethod?: string | null,
  employee?: string | null,
  minAmount?: number | null,
  maxAmount?: number | null
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
        
        console.log('🔍 [Dashboard] Starting data fetch with filters:', {
          startDate,
          endDate,
          selectedShops,
          selectedCategory,
          selectedProduct,
          paymentMethod,
          employee,
          minAmount,
          maxAmount
        });

        // Fetch bills data for sales metrics
        let billsQuery = supabase.from("bills").select(`
          id,
          total_amount,
          bill_date,
          payment_method,
          bill_items!inner(
            quantity,
            unit_price,
            product_name,
            product_id,
            products(id, name, price, cost_price, category)
          )
        `);
        
        // Apply date filters to bills
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          billsQuery = billsQuery.gte("bill_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          billsQuery = billsQuery.lte("bill_date", formattedEndDate);
        }
        
        const { data: billsData, error: billsError } = await billsQuery;
        
        if (billsError) {
          console.error('❌ [Dashboard] Error fetching bills:', billsError);
          throw billsError;
        }

        console.log('📊 [Dashboard] Bills data fetched:', billsData?.length || 0, 'bills');
        
        // Fetch collection data for payment methods
        let collectionQuery = supabase.from("credits").select(`
          credit_type,
          amount,
          credit_date
        `);
        
        // Apply payment method filter if specified
        if (paymentMethod && paymentMethod !== "all_payments") {
          collectionQuery = collectionQuery.eq('credit_type', paymentMethod);
        } else {
          collectionQuery = collectionQuery.in('credit_type', ['cash', 'card', 'online', 'given', 'received']);
        }
        
        // Apply date filters to collections
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          collectionQuery = collectionQuery.gte("credit_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          collectionQuery = collectionQuery.lte("credit_date", formattedEndDate);
        }
        
        // Apply HR store filter to collections
        if (selectedShops && selectedShops.length > 0) {
          collectionQuery = collectionQuery.in("hr_shop_id", selectedShops);
        }

        // Apply amount range filters
        if (minAmount !== null) {
          collectionQuery = collectionQuery.gte("amount", minAmount);
        }
        if (maxAmount !== null) {
          collectionQuery = collectionQuery.lte("amount", maxAmount);
        }
        
        const { data: collectionData, error: collectionError } = await collectionQuery;
        
        if (collectionError) {
          console.error('❌ [Dashboard] Error fetching credits:', collectionError);
          throw collectionError;
        }

        console.log('💰 [Dashboard] Credits data fetched:', collectionData?.length || 0, 'records');
        
        // Calculate totals for payment methods
        let cashAmount = 0;
        let cardAmount = 0;
        let onlineAmount = 0;
        let creditGiven = 0;
        let creditReceived = 0;
        
        collectionData?.forEach((item) => {
          if (item.credit_type === 'cash') {
            cashAmount += Number(item.amount) || 0;
          } else if (item.credit_type === 'card') {
            cardAmount += Number(item.amount) || 0;
          } else if (item.credit_type === 'online') {
            onlineAmount += Number(item.amount) || 0;
          } else if (item.credit_type === 'given') {
            creditGiven += Number(item.amount) || 0;
          } else if (item.credit_type === 'received') {
            creditReceived += Number(item.amount) || 0;
          }
        });

        const creditBalance = creditReceived - creditGiven;
        
        // Calculate sales metrics and profit/loss from bills
        let totalSales = 0;
        let totalProducts = 0;
        let totalRevenue = 0;
        let grossProfit = 0;
        let totalLoss = 0;
        
        billsData?.forEach((bill) => {
          totalSales++;
          
          bill.bill_items?.forEach((item: any) => {
            const quantity = Number(item.quantity) || 0;
            const sellingPrice = Number(item.unit_price) || 0;
            const costPrice = Number(item.products?.cost_price) || 0;
            
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
        });

        // Calculate net profit (gross profit - credit given + credit received)
        const netProfit = grossProfit - creditGiven + creditReceived;
        
        console.log('📈 [Dashboard] Calculated metrics:', {
          totalSales,
          totalProducts,
          totalRevenue,
          grossProfit,
          netProfit,
          totalLoss,
          creditGiven,
          creditReceived,
          creditBalance,
          cashAmount,
          cardAmount,
          onlineAmount
        });
        
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
        console.error("❌ [Dashboard] Error fetching summary data:", error);
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
            operator_name,
            products (id, name, price, cost_price),
            hr_stores!stocks_hr_shop_id_fkey (id, store_name)
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
        
        // Apply HR store filter
        if (selectedShops && selectedShops.length > 0) {
          query = query.in("hr_shop_id", selectedShops);
        }
        
        // Apply product filter
        if (selectedProduct) {
          query = query.eq("product_id", selectedProduct);
        }

        // Apply employee filter
        if (employee) {
          query = query.eq("operator_name", employee);
        }
        
        const { data: stockData, error } = await query;
        
        if (error) throw error;
        
        // Filter by category if needed (post-fetch filtering)
        let filteredStockData = selectedCategory && stockData
          ? stockData.filter((stock: any) => stock.products?.category === selectedCategory)
          : stockData;
        
        // Update state with stock data
        setData(prevData => ({
          ...prevData,
          stockEntries: filteredStockData || []
        }));
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setIsLoadingStock(false);
      }
    }
    
    fetchSummaryData();
    fetchStockData();
  }, [startDate, endDate, selectedShops, selectedCategory, selectedProduct, paymentMethod, employee, minAmount, maxAmount]);

  return { data, isLoading, isLoadingStock };
};
