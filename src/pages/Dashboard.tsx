
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import StockChart from "@/components/stock/StockChart";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { PaymentMethodsDisplay } from "@/components/dashboard/PaymentMethodsDisplay";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  const { data, isLoading, isLoadingStock } = useDashboardData(
    startDate, 
    endDate, 
    selectedShops, 
    selectedCategory, 
    selectedProduct
  );

  const averageSaleValue = data.totalSales > 0 
    ? data.totalRevenue / data.totalSales 
    : 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <DashboardHeader 
            title="Dashboard" 
            subtitle="View your business analytics and performance" 
          />
          
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
        
        <PaymentMethodsDisplay 
          cashAmount={data.cashAmount}
          cardAmount={data.cardAmount}
          onlineAmount={data.onlineAmount}
        />
        
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
        
        <div>
          <StockChart 
            entries={data.stockEntries}
            isLoading={isLoadingStock}
            startDate={startDate}
            endDate={endDate}
            shopIds={selectedShops}
            productId={selectedProduct}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
