
import React, { useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import CollectionSummary from "@/components/dashboard/CollectionSummary";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  // State for filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Fetch dashboard data
  const { data, isLoading } = useDashboardData(
    startDate,
    endDate,
    selectedShops,
    selectedCategory,
    selectedProduct
  );

  const averageSaleValue = data.totalSales > 0 ? data.totalRevenue / data.totalSales : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardMetrics
            totalRevenue={data.totalRevenue}
            totalSales={data.totalSales}
            totalProducts={data.totalProducts}
            averageSaleValue={averageSaleValue}
            creditGiven={data.creditGiven}
            creditReceived={data.creditReceived}
            creditBalance={data.creditBalance}
            grossProfit={data.grossProfit}
            netProfit={data.netProfit}
            totalLoss={data.totalLoss}
          />
          <ChartsOverview
            startDate={startDate}
            endDate={endDate}
            selectedShops={selectedShops}
            selectedCategory={selectedCategory}
            selectedProduct={selectedProduct}
          />
        </div>
        <div className="space-y-6">
          <LowStockAlert />
          <CollectionSummary
            startDate={startDate}
            endDate={endDate}
            shopIds={selectedShops}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
