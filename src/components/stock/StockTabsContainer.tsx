
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockList from "./StockList";
import StockForm from "./StockForm";
import BatchStockEntry from "./BatchStockEntry";
import CollectionList from "@/components/collection/CollectionList";
import CollectionForm from "@/components/collection/CollectionForm";
import { DateRange } from "react-day-picker";

interface StockTabsContainerProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showForm: boolean;
  showBatchEntry: boolean;
  showCollectionForm: boolean;
  refreshTrigger: number;
  dateRange?: DateRange;
  handleStockAdded: () => void;
  handleCollectionAdded: () => void;
}

const StockTabsContainer: React.FC<StockTabsContainerProps> = ({
  activeTab,
  setActiveTab,
  showForm,
  showBatchEntry,
  showCollectionForm,
  refreshTrigger,
  dateRange,
  handleStockAdded,
  handleCollectionAdded
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 bg-muted/50">
        <TabsTrigger value="list" className="flex-1">Stock List</TabsTrigger>
        {showForm && <TabsTrigger value="entry" className="flex-1">Add Stock Entry</TabsTrigger>}
        {showBatchEntry && <TabsTrigger value="batch" className="flex-1">Batch Entry</TabsTrigger>}
        <TabsTrigger value="collection" className="flex-1">Collection</TabsTrigger>
        {showCollectionForm && <TabsTrigger value="add-collection" className="flex-1">Add Collection</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="list" className="space-y-6">
        <StockList refreshTrigger={refreshTrigger} dateRange={dateRange} />
      </TabsContent>
      
      {showForm && (
        <TabsContent value="entry" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
            <StockForm 
              onSuccess={handleStockAdded} 
              // Fix: Remove initialData prop as it doesn't exist in StockFormProps
            />
          </div>
        </TabsContent>
      )}

      {showBatchEntry && (
        <TabsContent value="batch" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
            <BatchStockEntry 
              onSuccess={handleStockAdded}
              // Fix: Pass required props according to BatchStockEntry component definition
            />
          </div>
        </TabsContent>
      )}
      
      <TabsContent value="collection" className="space-y-6">
        <CollectionList />
      </TabsContent>
      
      {showCollectionForm && (
        <TabsContent value="add-collection" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
            <CollectionForm 
              onSuccess={handleCollectionAdded}
              onCancel={() => {
                setActiveTab("collection");
              }}
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default StockTabsContainer;
