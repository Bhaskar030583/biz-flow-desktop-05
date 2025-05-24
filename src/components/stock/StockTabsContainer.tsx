
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
      <TabsList className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800">
        <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Stock List</TabsTrigger>
        {showForm && <TabsTrigger value="entry" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Add Stock Entry</TabsTrigger>}
        {showBatchEntry && <TabsTrigger value="batch" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Batch Entry</TabsTrigger>}
        <TabsTrigger value="collection" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Collection</TabsTrigger>
        {showCollectionForm && <TabsTrigger value="add-collection" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">Add Collection</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="list" className="space-y-6">
        <StockList refreshTrigger={refreshTrigger} dateRange={dateRange} />
      </TabsContent>
      
      {showForm && (
        <TabsContent value="entry" className="space-y-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 p-6 rounded-lg shadow-lg border border-blue-200 dark:border-blue-800">
            <StockForm 
              onSuccess={handleStockAdded}
              onCancel={() => setActiveTab("list")}
            />
          </div>
        </TabsContent>
      )}

      {showBatchEntry && (
        <TabsContent value="batch" className="space-y-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 p-6 rounded-lg shadow-lg border border-blue-200 dark:border-blue-800">
            <BatchStockEntry 
              onSuccess={handleStockAdded}
              onCancel={() => setActiveTab("list")}
            />
          </div>
        </TabsContent>
      )}
      
      <TabsContent value="collection" className="space-y-6">
        <CollectionList />
      </TabsContent>
      
      {showCollectionForm && (
        <TabsContent value="add-collection" className="space-y-6">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950 p-6 rounded-lg shadow-lg border border-blue-200 dark:border-blue-800">
            <CollectionForm 
              onSuccess={handleCollectionAdded}
              initialData={{}}
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default StockTabsContainer;
