
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import StockForm from "./StockForm";
import StockList from "./StockList";
import StockImport from "./StockImport";
import ProductStockManagement from "./ProductStockManagement";
import { Package, FileSpreadsheet, BarChart3, Settings } from "lucide-react";

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
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="management" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Product Management</span>
          <span className="sm:hidden">Manage</span>
        </TabsTrigger>
        <TabsTrigger value="entries" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Stock Entries</span>
          <span className="sm:hidden">Entries</span>
        </TabsTrigger>
        <TabsTrigger value="add" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Add Stock</span>
          <span className="sm:hidden">Add</span>
        </TabsTrigger>
        <TabsTrigger value="import" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Import Excel</span>
          <span className="sm:hidden">Import</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="management" className="space-y-4">
        <ProductStockManagement 
          onStockUpdated={handleStockUpdated} 
          refreshTrigger={refreshTrigger}
        />
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
