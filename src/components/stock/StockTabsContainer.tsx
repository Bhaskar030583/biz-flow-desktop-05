
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ProductStockManagement from "./ProductStockManagement";
import NewStockManagement from "./NewStockManagement";
import StockList from "./StockList";
import StockForm from "./StockForm";
import { BatchStockEntryModal } from "./BatchStockEntryModal";
import { useSearchParams } from "react-router-dom";

interface StockTabsContainerProps {
  showForm: boolean;
  handleStockAdded: () => void;
  setShowForm: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const StockTabsContainer = ({
  showForm,
  handleStockAdded,
  setShowForm,
  activeTab,
  setActiveTab
}: StockTabsContainerProps) => {
  const [searchParams] = useSearchParams();

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without causing a navigation
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', value);
    window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="management">Management</TabsTrigger>
        <TabsTrigger value="add-stock">Add Stock</TabsTrigger>
        <TabsTrigger value="list">Stock List</TabsTrigger>
        <TabsTrigger value="create">Create Entry</TabsTrigger>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="management" className="space-y-4">
        <ProductStockManagement onStockUpdated={handleStockAdded} />
      </TabsContent>

      <TabsContent value="add-stock" className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <NewStockManagement 
              onSuccess={handleStockAdded}
              onCancel={() => setActiveTab("management")}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="list" className="space-y-4">
        <StockList refreshTrigger={0} />
      </TabsContent>

      <TabsContent value="create" className="space-y-4">
        {showForm ? (
          <StockForm 
            onSuccess={handleStockAdded}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Create individual stock entries one at a time.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create New Stock Entry
              </button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="import" className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <BatchStockEntryModal />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports" className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Stock Reports</h3>
              <p className="text-muted-foreground">
                Advanced stock reporting features coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default StockTabsContainer;
