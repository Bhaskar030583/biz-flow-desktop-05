
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashboard Overview</h1>
          <div className="text-sm text-gray-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
          <h2 className="text-lg font-medium mb-3 text-indigo-700">Data Filters</h2>
          <DashboardFilters onFilterChange={handleFilterChange} />
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-blue-700">Total Sales</CardTitle>
                <CardDescription>Revenue overview</CardDescription>
              </div>
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold text-blue-900">
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
          
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-amber-700">Profit/Loss</CardTitle>
                <CardDescription>Financial summary</CardDescription>
              </div>
              <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold text-amber-900">
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
          
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2 space-y-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-emerald-700">Credits</CardTitle>
                <CardDescription>Given & Received</CardDescription>
              </div>
              <div className={`p-2 rounded-full ${isPositiveBalance ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <CreditIcon className="h-5 w-5" />
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
                  <div className="flex items-center text-emerald-500">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span>{creditReceived.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed">
                  <span className="text-sm font-medium">Balance:</span>
                  <div className="flex items-center text-lg font-bold">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span className={isPositiveBalance ? "text-emerald-500" : "text-red-500"}>
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
        <Card className="border-none shadow-sm mb-8 bg-gradient-to-br from-white to-purple-50/30 border border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent border-b border-purple-100">
            <CardTitle className="text-purple-800">Sales Performance</CardTitle>
            <CardDescription>View your sales trends over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
          <Card className="border-none shadow-sm bg-gradient-to-r from-cyan-50 to-blue-50 border border-blue-100">
            <CardHeader className="border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Welcome to Your Business Metrics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">To get started with tracking your business metrics, you'll need to:</p>
              <div className="bg-white p-4 rounded-md border border-blue-100 shadow-sm">
                <ol className="list-decimal pl-5 space-y-2">
                  <li className="text-sm text-blue-800">Add your first shop through the Shops section</li>
                  <li className="text-sm text-blue-800">Create product categories and products</li>
                  <li className="text-sm text-blue-800">Enter stock and sales data</li>
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
