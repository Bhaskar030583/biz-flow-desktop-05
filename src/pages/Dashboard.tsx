
import React from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { ChartsOverview } from "@/components/dashboard/ChartsOverview";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { CollectionSummary } from "@/components/dashboard/CollectionSummary";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardMetrics />
          <ChartsOverview />
        </div>
        <div className="space-y-6">
          <LowStockAlert />
          <CollectionSummary />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
