
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import StockForm from "./StockForm";
import StockList from "./StockList";
import StockImport from "./StockImport";
import ProductStockManagement from "./ProductStockManagement";
import ShiftManagement from "./ShiftManagement";
import LossTracking from "./LossTracking";
import AdvancedReporting from "./AdvancedReporting";
import LowStockAlerts from "./LowStockAlerts";
import { Package, FileSpreadsheet, BarChart3, Settings, Clock, AlertTriangle, TrendingDown, Bell } from "lucide-react";

interface StockTabsContainerProps {
  showForm: boolean;
  handleStockAdded: () => void;
  setShowForm: (show: boolean) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const StockTabsContainer = ({ 
  showForm, 
  handleStockAdded, 
  setShowForm,
  activeTab = "management",
  setActiveTab 
}: StockTabsContainerProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (value: string) => {
    if (setActiveTab) {
      setActiveTab(value);
    }
  };

  const handleStockUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    handleStockAdded();
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-8 mb-6">
        <TabsTrigger value="management" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Management</span>
          <span className="sm:hidden">Mgmt</span>
        </TabsTrigger>
        <TabsTrigger value="shifts" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Shifts</span>
        </TabsTrigger>
        <TabsTrigger value="losses" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Losses</span>
        </TabsTrigger>
        <TabsTrigger value="alerts" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alerts</span>
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4" />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
        <TabsTrigger value="entries" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Entries</span>
        </TabsTrigger>
        <TabsTrigger value="add" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </TabsTrigger>
        <TabsTrigger value="import" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="management" className="space-y-4">
        <ProductStockManagement 
          onStockUpdated={handleStockUpdated} 
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="shifts" className="space-y-4">
        <ShiftManagement />
      </TabsContent>

      <TabsContent value="losses" className="space-y-4">
        <LossTracking />
      </TabsContent>

      <TabsContent value="alerts" className="space-y-4">
        <LowStockAlerts />
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <AdvancedReporting />
      </TabsContent>

      <TabsContent value="entries" className="space-y-4">
        <StockList refreshTrigger={refreshTrigger} />
      </TabsContent>

      <TabsContent value="add" className="space-y-4">
        {showForm ? (
          <Card>
            <CardContent className="pt-6">
              <StockForm 
                onSuccess={handleStockAdded}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <StockList refreshTrigger={refreshTrigger} />
        )}
      </TabsContent>

      <TabsContent value="import" className="space-y-4">
        <StockImport onComplete={handleStockAdded} />
      </TabsContent>
    </Tabs>
  );
};

export default StockTabsContainer;
