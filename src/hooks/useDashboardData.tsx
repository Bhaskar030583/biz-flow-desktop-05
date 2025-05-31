
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

        // Fetch bills data for sales metrics - simplified query first
        let billsQuery = supabase.from("bills").select(`
          id,
          total_amount,
          bill_date,
          payment_method
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
        
        // Apply payment method filter
        if (paymentMethod && paymentMethod !== 'all') {
          billsQuery = billsQuery.eq("payment_method", paymentMethod);
        }
        
        const { data: billsData, error: billsError } = await billsQuery;
        
        if (billsError) {
          console.error('❌ [Dashboard] Error fetching bills:', billsError);
          // Continue with empty data instead of throwing
        }

        console.log('📊 [Dashboard] Bills data fetched:', billsData?.length || 0, 'bills');
        
        // Fetch bill items separately to avoid complex joins that might fail
        let billItemsData = [];
        if (billsData && billsData.length > 0) {
          const billIds = billsData.map(bill => bill.id);
          
          const { data: items, error: itemsError } = await supabase
            .from("bill_items")
            .select(`
              quantity,
              unit_price,
              total_price,
              product_name,
              product_id,
              bill_id
            `)
            .in('bill_id', billIds);
          
          if (itemsError) {
            console.error('❌ [Dashboard] Error fetching bill items:', itemsError);
          } else {
            billItemsData = items || [];
          }
        }

        console.log('📊 [Dashboard] Bill items fetched:', billItemsData.length, 'items');
        
        // Fetch credits data with simplified query
        let creditsQuery = supabase.from("credits").select(`
          credit_type,
          amount,
          credit_date
        `);
        
        // Apply date filters to credits
        if (startDate) {
          const formattedStartDate = startDate.toISOString().split('T')[0];
          creditsQuery = creditsQuery.gte("credit_date", formattedStartDate);
        }
        
        if (endDate) {
          const formattedEndDate = endDate.toISOString().split('T')[0];
          creditsQuery = creditsQuery.lte("credit_date", formattedEndDate);
        }
        
        // Apply HR store filter to credits if available
        if (selectedShops && selectedShops.length > 0) {
          creditsQuery = creditsQuery.in("hr_shop_id", selectedShops);
        }

        // Apply amount range filters
        if (minAmount !== null) {
          creditsQuery = creditsQuery.gte("amount", minAmount);
        }
        if (maxAmount !== null) {
          creditsQuery = creditsQuery.lte("amount", maxAmount);
        }
        
        const { data: creditsData, error: creditsError } = await creditsQuery;
        
        if (creditsError) {
          console.error('❌ [Dashboard] Error fetching credits:', creditsError);
          // Continue with empty data instead of throwing
        }

        console.log('💰 [Dashboard] Credits data fetched:', creditsData?.length || 0, 'records');
        
        // Calculate payment method totals from bills data
        let cashAmount = 0;
        let cardAmount = 0;
        let onlineAmount = 0;
        
        billsData?.forEach((bill) => {
          const amount = Number(bill.total_amount) || 0;
          switch (bill.payment_method?.toLowerCase()) {
            case 'cash':
              cashAmount += amount;
              break;
            case 'card':
              cardAmount += amount;
              break;
            case 'upi':
            case 'online':
              onlineAmount += amount;
              break;
          }
        });
        
        // Calculate credit amounts from credits data
        let creditGiven = 0;
        let creditReceived = 0;
        
        creditsData?.forEach((item) => {
          const amount = Number(item.amount) || 0;
          switch (item.credit_type) {
            case 'given':
              creditGiven += amount;
              break;
            case 'received':
              creditReceived += amount;
              break;
          }
        });

        const creditBalance = creditReceived - creditGiven;
        
        // Calculate sales metrics from bills and bill items
        let totalSales = billsData?.length || 0;
        let totalProducts = 0;
        let totalRevenue = 0;
        let grossProfit = 0;
        let totalLoss = 0;
        
        // Sum up bill totals for revenue
        billsData?.forEach((bill) => {
          totalRevenue += Number(bill.total_amount) || 0;
        });

        // Sum up quantities from bill items
        billItemsData.forEach((item: any) => {
          totalProducts += Number(item.quantity) || 0;
        });

        // For profit calculation, we need product cost prices
        // Get unique product IDs from bill items
        const productIds = [...new Set(billItemsData.map((item: any) => item.product_id))];
        let productCosts: Record<string, number> = {};
        
        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("id, cost_price")
            .in("id", productIds);
          
          if (!productsError && productsData) {
            productsData.forEach(product => {
              productCosts[product.id] = Number(product.cost_price) || 0;
            });
          }
        }

        // Calculate gross profit and losses
        billItemsData.forEach((item: any) => {
          const quantity = Number(item.quantity) || 0;
          const sellingPrice = Number(item.unit_price) || 0;
          const costPrice = productCosts[item.product_id] || 0;
          
          const profitPerUnit = sellingPrice - costPrice;
          const totalProfitForItem = profitPerUnit * quantity;
          
          if (totalProfitForItem > 0) {
            grossProfit += totalProfitForItem;
          } else {
            totalLoss += Math.abs(totalProfitForItem);
          }
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
        
        // Simplified stock query to avoid RLS issues
        let query = supabase
          .from("stocks")
          .select(`
            id, 
            stock_date, 
            opening_stock, 
            closing_stock, 
            actual_stock,
            operator_name,
            product_id,
            hr_shop_id
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
        
        if (error) {
          console.error("❌ [Dashboard] Error fetching stock data:", error);
          // Continue with empty data instead of throwing
        }
        
        // Update state with stock data
        setData(prevData => ({
          ...prevData,
          stockEntries: stockData || []
        }));
      } catch (error) {
        console.error("❌ [Dashboard] Error fetching stock data:", error);
      } finally {
        setIsLoadingStock(false);
      }
    }
    
    fetchSummaryData();
    fetchStockData();
  }, [startDate, endDate, selectedShops, selectedCategory, selectedProduct, paymentMethod, employee, minAmount, maxAmount]);

  return { data, isLoading, isLoadingStock };
};
