
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockList from "./StockList";
import StockChart from "./StockChart";
import NewStockManagement from "./NewStockManagement";
import CollectionForm from "../collection/CollectionForm";
import StockRealtimeView from "./StockRealtimeView";

interface StockTabsContainerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showForm: boolean;
  showBatchEntry: boolean;
  showCollectionForm: boolean;
  refreshTrigger: number;
  handleStockAdded: () => void;
  handleBatchAdded: () => void;
  handleCollectionAdded: () => void;
}

const StockTabsContainer = ({
  activeTab,
  setActiveTab,
  showForm,
  showBatchEntry,
  showCollectionForm,
  refreshTrigger,
  handleStockAdded,
  handleBatchAdded,
  handleCollectionAdded,
}: StockTabsContainerProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="list">Stock List</TabsTrigger>
        <TabsTrigger value="chart">Analytics</TabsTrigger>
        <TabsTrigger value="view">Real-time View</TabsTrigger>
        <TabsTrigger value="management">Management</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-4">
        <StockList refreshTrigger={refreshTrigger} />
      </TabsContent>

      <TabsContent value="chart" className="space-y-4">
        <StockChart refreshTrigger={refreshTrigger} />
      </TabsContent>

      <TabsContent value="view" className="space-y-4">
        <StockRealtimeView />
      </TabsContent>

      <TabsContent value="management" className="space-y-4">
        {showForm && (
          <NewStockManagement 
            onSuccess={handleStockAdded}
            onCancel={() => setActiveTab("list")}
          />
        )}
        
        {showBatchEntry && (
          <NewStockManagement 
            onSuccess={handleBatchAdded}
            onCancel={() => setActiveTab("list")}
          />
        )}
        
        {showCollectionForm && (
          <CollectionForm 
            onSuccess={handleCollectionAdded}
          />
        )}

        {!showForm && !showBatchEntry && !showCollectionForm && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Use the buttons in the header to add stock entries, manage batch entries, or add collections.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default StockTabsContainer;
