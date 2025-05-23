
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { IndianRupee } from "lucide-react";
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Filters */}
        <DashboardFilters onFilterChange={handleFilterChange} />
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>0.00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.startDate || filters.endDate ? 
                  `For selected date range` : 
                  `No sales data yet`
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>0.00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.startDate || filters.endDate ? 
                  `For selected date range` : 
                  `No data available`
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
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
                    <span className={creditReceived - creditGiven >= 0 ? "text-green-500" : "text-red-500"}>
                      {(creditReceived - creditGiven).toFixed(2)}
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
        <div className="mb-8">
          <SalesChart 
            startDate={filters.startDate} 
            endDate={filters.endDate}
            shopId={filters.shopId}
            categoryId={filters.category}
            productId={filters.productId}
          />
        </div>
        
        {/* Welcome Card - Show only if no filters are applied */}
        {!filters.startDate && !filters.endDate && !filters.shopId && !filters.category && !filters.productId && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Your Business Metrics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>To get started, you'll need to:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Add your first shop</li>
                  <li>Create some products</li>
                  <li>Enter sales data</li>
                </ol>
                <p className="mt-4">
                  Once you have data in the system, you'll be able to see detailed metrics, charts, and reports here.
                  Use the filters above to narrow down your data view.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

