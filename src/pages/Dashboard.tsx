
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import StockChart from "@/components/stock/StockChart";
import { supabase } from "@/integrations/supabase/client";
import CollectionSummary from "@/components/dashboard/CollectionSummary";

const Dashboard = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [salesData, setSalesData] = useState<any>({
    totalSales: 0,
    totalProducts: 0,
    totalRevenue: 0,
    cashAmount: 0,
    cardAmount: 0,
    onlineAmount: 0,
  });
  
  useEffect(() => {
    async function fetchSummaryData() {
      try {
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
        
        setSalesData({
          totalSales,
          totalProducts,
          totalRevenue,
          cashAmount,
          cardAmount,
          onlineAmount,
        });
        
      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    }
    
    fetchSummaryData();
    fetchStockData();
  }, [startDate, endDate, selectedShops, selectedCategory, selectedProduct]);
  
  const fetchStockData = async () => {
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
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setStockEntries(data || []);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setStockEntries([]);
    } finally {
      setIsLoadingStock(false);
    }
  };
  
  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const PaymentMethodCard = ({ title, amount, icon, percentage, total }: { title: string, amount: number, icon: React.ReactNode, percentage: number, total: number }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="text-2xl font-bold">{formatIndianRupee(amount)}</div>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% of total revenue
          </div>
          <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm">View your business analytics and performance</p>
          </div>
          
          <DashboardFilters
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            selectedShops={selectedShops}
            setSelectedShops={setSelectedShops}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <div className="text-2xl font-bold">{formatIndianRupee(salesData.totalRevenue)}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Sales</p>
                  <div className="text-2xl font-bold">{salesData.totalSales}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Products Sold</p>
                  <div className="text-2xl font-bold">{salesData.totalProducts}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Sale Value</p>
                  <div className="text-2xl font-bold">
                    {salesData.totalSales > 0 
                      ? formatIndianRupee(salesData.totalRevenue / salesData.totalSales) 
                      : formatIndianRupee(0)}
                  </div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SalesChart 
              startDate={startDate}
              endDate={endDate}
              shopIds={selectedShops}
              categoryId={selectedCategory}
              productId={selectedProduct}
            />
          </div>
          <div>
            <CollectionSummary
              startDate={startDate}
              endDate={endDate}
              shopIds={selectedShops}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Payment Methods</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Cash Card */}
            <PaymentMethodCard
              title="Cash Collections"
              amount={salesData.cashAmount}
              icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>}
              percentage={salesData.cashAmount / (salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount) * 100 || 0}
              total={salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount}
            />
            
            {/* Card Card */}
            <PaymentMethodCard
              title="Card Collections"
              amount={salesData.cardAmount}
              icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>}
              percentage={salesData.cardAmount / (salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount) * 100 || 0}
              total={salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount}
            />
            
            {/* Online Card */}
            <PaymentMethodCard
              title="Online Collections"
              amount={salesData.onlineAmount}
              icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
              percentage={salesData.onlineAmount / (salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount) * 100 || 0}
              total={salesData.cashAmount + salesData.cardAmount + salesData.onlineAmount}
            />
          </div>
        </div>
        
        <div>
          <StockChart 
            entries={stockEntries}
            isLoading={isLoadingStock}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
