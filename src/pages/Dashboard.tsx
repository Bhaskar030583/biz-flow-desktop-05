
import React, { useState } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import CollectionSummary from "@/components/dashboard/CollectionSummary";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DenominationManagement } from "@/components/dashboard/DenominationManagement";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  // State for filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [employee, setEmployee] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);

  // Fetch dashboard data
  const { data, isLoading } = useDashboardData(
    startDate,
    endDate,
    selectedShops,
    selectedCategory,
    selectedProduct,
    paymentMethod,
    employee,
    minAmount,
    maxAmount
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
      {/* Enhanced Filters */}
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
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        employee={employee}
        setEmployee={setEmployee}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Dashboard Content */}
        <div className="xl:col-span-3 space-y-6">
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

        {/* Denomination Management Sidebar */}
        <div className="xl:col-span-1">
          <DenominationManagement />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
