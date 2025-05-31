
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { CollectionSummary } from "@/components/dashboard/CollectionSummary";
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
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">Loading dashboard data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
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

        <div className="grid grid-cols-1 2xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Dashboard Content */}
          <div className="2xl:col-span-3 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="lg:col-span-3 space-y-4 sm:space-y-6">
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
                  cashAmount={data.cashAmount}
                  onlineAmount={data.onlineAmount}
                />
                <ChartsOverview
                  startDate={startDate}
                  endDate={endDate}
                  selectedShops={selectedShops}
                  selectedCategory={selectedCategory}
                  selectedProduct={selectedProduct}
                />
              </div>
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <LowStockAlert />
                <div className="lg:hidden">
                  <CollectionSummary
                    startDate={startDate}
                    endDate={endDate}
                    selectedShops={selectedShops}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Denomination Management Sidebar */}
          <div className="2xl:col-span-1 space-y-4 sm:space-y-6">
            <DenominationManagement />
            <div className="hidden lg:block 2xl:hidden">
              <CollectionSummary
                startDate={startDate}
                endDate={endDate}
                selectedShops={selectedShops}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
