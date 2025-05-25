
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
  console.log("StockTabsContainer rendered with activeTab:", activeTab);
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <TabsTrigger value="list" className="text-xs sm:text-sm px-2 py-2">
            Stock List
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs sm:text-sm px-2 py-2">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="view" className="text-xs sm:text-sm px-2 py-2">
            Real-time
          </TabsTrigger>
          <TabsTrigger value="management" className="text-xs sm:text-sm px-2 py-2">
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <StockList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <StockChart />
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <StockRealtimeView />
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <NewStockManagement 
            onSuccess={handleStockAdded}
            onCancel={() => setActiveTab("list")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockTabsContainer;
