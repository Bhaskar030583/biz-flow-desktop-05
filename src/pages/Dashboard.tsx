
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle, CreditCard as CreditIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface DashboardFilters {
  startDate: Date | null;
  endDate: Date | null;
  shopId: string | null;
  category: string | null;
  productId: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: null,
    endDate: null,
    shopId: null,
    category: null,
    productId: null
  });
  const [creditGiven, setCreditGiven] = useState(0);
  const [creditReceived, setCreditReceived] = useState(0);

  const handleFilterChange = (newFilters: DashboardFilters) => {
    // Convert "all" values to null
    const processedFilters = {
      ...newFilters,
      shopId: newFilters.shopId === "all" ? null : newFilters.shopId,
      category: newFilters.category === "all" ? null : newFilters.category,
      productId: newFilters.productId === "all" ? null : newFilters.productId
    };
    setFilters(processedFilters);
  };

  // Fetch credit data based on filters
  useEffect(() => {
    const fetchCreditData = async () => {
      if (!user) return;

      try {
        let givenQuery = supabase
          .from("credits")
          .select("amount")
          .eq("user_id", user.id)
          .eq("credit_type", "given");
        
        let receivedQuery = supabase
          .from("credits")
          .select("amount")
          .eq("user_id", user.id)
          .eq("credit_type", "received");
        
        // Apply date filters if present
        if (filters.startDate) {
          const startDateStr = filters.startDate.toISOString().split('T')[0];
          givenQuery = givenQuery.gte("credit_date", startDateStr);
          receivedQuery = receivedQuery.gte("credit_date", startDateStr);
        }
        
        if (filters.endDate) {
          const endDateStr = filters.endDate.toISOString().split('T')[0];
          givenQuery = givenQuery.lte("credit_date", endDateStr);
          receivedQuery = receivedQuery.lte("credit_date", endDateStr);
        }
        
        // Apply shop filter if present
        if (filters.shopId) {
          givenQuery = givenQuery.eq("shop_id", filters.shopId);
          receivedQuery = receivedQuery.eq("shop_id", filters.shopId);
        }
        
        // Execute both queries
        const [givenResult, receivedResult] = await Promise.all([
          givenQuery,
          receivedQuery
        ]);
        
        // Calculate totals
        const totalGiven = givenResult.data?.reduce((sum, item) => 
          sum + parseFloat(String(item.amount)), 0) || 0;
        
        const totalReceived = receivedResult.data?.reduce((sum, item) => 
          sum + parseFloat(String(item.amount)), 0) || 0;
        
        setCreditGiven(totalGiven);
        setCreditReceived(totalReceived);
        
      } catch (error) {
        console.error("Error fetching credit data:", error);
      }
    };
    
    fetchCreditData();
  }, [filters, user]);

  const creditBalance = creditReceived - creditGiven;
  const isPositiveBalance = creditBalance >= 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
          <h2 className="text-lg font-medium mb-3">Data Filters</h2>
          <DashboardFilters onFilterChange={handleFilterChange} />
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <CardDescription>Revenue overview</CardDescription>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>0.00</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filters.startDate || filters.endDate ? 
                  `For selected date range` : 
                  `No sales data yet`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
                <CardDescription>Financial summary</CardDescription>
              </div>
              <div className="bg-muted p-2 rounded-full">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>0.00</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filters.startDate || filters.endDate ? 
                  `For selected date range` : 
                  `No data available`
                }
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Credits</CardTitle>
                <CardDescription>Given & Received</CardDescription>
              </div>
              <div className={`p-2 rounded-full ${isPositiveBalance ? 'bg-green-100' : 'bg-red-100'}`}>
                <CreditIcon className={`h-5 w-5 ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Given:</span>
                  <div className="flex items-center text-red-500">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span>{creditGiven.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Received:</span>
                  <div className="flex items-center text-green-500">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span>{creditReceived.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-sm font-medium">Balance:</span>
                  <div className="flex items-center text-lg font-bold">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span className={isPositiveBalance ? "text-green-500" : "text-red-500"}>
                      {creditBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {filters.startDate || filters.endDate || filters.shopId ? 
                  `Filtered credit data` : 
                  `All credit data`
                }
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Card className="border-none shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>View your sales trends over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SalesChart 
              startDate={filters.startDate} 
              endDate={filters.endDate}
              shopId={filters.shopId}
              categoryId={filters.category}
              productId={filters.productId}
            />
          </CardContent>
        </Card>
        
        {/* Welcome Card - Show only if no filters are applied */}
        {!filters.startDate && !filters.endDate && !filters.shopId && !filters.category && !filters.productId && (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Welcome to Your Business Metrics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">To get started with tracking your business metrics, you'll need to:</p>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <ol className="list-decimal pl-5 space-y-2">
                  <li className="text-sm">Add your first shop through the Shops section</li>
                  <li className="text-sm">Create product categories and products</li>
                  <li className="text-sm">Enter stock and sales data</li>
                </ol>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Once you have data in the system, you'll be able to see detailed metrics, charts, and reports here.
                Use the filters above to narrow down your data view.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
