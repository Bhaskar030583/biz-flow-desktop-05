
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import StockChart from "@/components/stock/StockChart";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { PaymentMethodsDisplay } from "@/components/dashboard/PaymentMethodsDisplay";
import { GridViewControls } from "@/components/dashboard/GridViewControls";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { TotalStockValue } from "@/components/dashboard/TotalStockValue";
import { DenominationManagement } from "@/components/dashboard/DenominationManagement";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDataSync } from "@/context/DataSyncContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { refreshTrigger } = useDataSync();
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState<number>(5);
  const isMobile = useIsMobile();
  
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
      <div className="w-full max-w-7xl mx-auto" key={refreshTrigger}>
        
        {/* Morning Denomination Setup */}
        <div className="mb-6">
          <DenominationManagement />
        </div>
        
        {/* Quick Actions Bar */}
        <div className={`mb-6 flex ${isMobile ? 'flex-col gap-3' : 'flex-wrap items-center gap-3'} p-4 bg-white rounded-lg border border-blue-100 shadow-sm`}>
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-3'}`}>
            <LowStockAlert threshold={10} />
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="mb-6">
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
        
        {/* Total Stock Value Section */}
        <div className="mb-6">
          <TotalStockValue />
        </div>
        
        {/* Payment Methods Section */}
        <div className="mb-6">
          <PaymentMethodsDisplay 
            cashAmount={data.cashAmount}
            cardAmount={data.cardAmount}
            onlineAmount={data.onlineAmount}
            creditReceived={data.creditReceived}
            creditGiven={data.creditGiven}
          />
        </div>
        
        {/* Grid View Controls - Hide on mobile */}
        {!isMobile && (
          <div className="mb-4">
            <GridViewControls
              currentView={gridColumns}
              onViewChange={setGridColumns}
            />
          </div>
        )}
        
        {/* Metrics Section */}
        <div className="mb-6">
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
            gridColumns={isMobile ? 2 : gridColumns}
          />
        </div>
        
        {/* Charts Overview Section */}
        <div className="mb-6">
          <ChartsOverview 
            startDate={startDate}
            endDate={endDate}
            selectedShops={selectedShops}
            selectedCategory={selectedCategory}
            selectedProduct={selectedProduct}
          />
        </div>
        
        {/* Stock Chart Section */}
        <div className="mb-6">
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
