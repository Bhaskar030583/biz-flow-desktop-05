
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { IndianRupee } from "lucide-react";

interface DashboardFilters {
  startDate: Date | null;
  endDate: Date | null;
  shopId: string | null;
  category: string | null;
  productId: string | null;
}

const Dashboard = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: null,
    endDate: null,
    shopId: null,
    category: null,
    productId: null
  });

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

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
              <div className="flex items-center text-2xl font-bold">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>0.00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.startDate || filters.endDate ? 
                  `For selected date range` : 
                  `No credit data yet`
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
