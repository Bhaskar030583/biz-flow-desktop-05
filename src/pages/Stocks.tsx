
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useDataSync } from "@/context/DataSyncContext";
import { useDataSyncActions } from "@/hooks/useDataSyncActions";
import StockImport from "@/components/stock/StockImport";
import StockHeader from "@/components/stock/StockHeader";
import StockExportProgress from "@/components/stock/StockExportProgress";
import StockTabsContainer from "@/components/stock/StockTabsContainer";
import { exportStockData } from "@/components/stock/StockExportService";

const Stocks = () => {
  const { refreshTrigger } = useDataSync();
  const { syncAfterStockChange } = useDataSyncActions();
  const [showForm, setShowForm] = useState(false);
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("list");
  const [stockCount, setStockCount] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [dateLabel, setDateLabel] = useState("Last 7 days");
  const [showCollectionForm, setShowCollectionForm] = useState(false);

  useEffect(() => {
    const countStockEntries = async () => {
      try {
        const { count, error } = await supabase
          .from("stocks")
          .select("*", { count: 'exact', head: true });
        
        if (error) throw error;
        setStockCount(count || 0);
      } catch (error) {
        console.error("Error counting stock entries:", error);
      }
    };
    
    countStockEntries();
  }, [refreshTrigger, refreshStockTrigger]);

  const handleStockAdded = async () => {
    setShowForm(false);
    setShowBatchEntry(false);
    setRefreshStockTrigger(prev => prev + 1);
    await syncAfterStockChange('create');
  };

  const handleImportComplete = async () => {
    setShowImport(false);
    setRefreshStockTrigger(prev => prev + 1);
    await syncAfterStockChange('import');
  };
  
  const handleCollectionAdded = async () => {
    setShowCollectionForm(false);
    setRefreshStockTrigger(prev => prev + 1);
    await syncAfterStockChange('collection');
  };

  const handleExport = async () => {
    if (stockCount === 0) {
      toast.error("No stock entries to export. Please add stock entries first.");
      return;
    }
    
    await exportStockData(setExporting, setExportProgress);
  };

  const combinedRefreshTrigger = refreshTrigger + refreshStockTrigger;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <StockHeader 
          stockCount={stockCount}
          exporting={exporting}
          dateLabel={dateLabel}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setDateLabel={setDateLabel}
          handleExport={handleExport}
          showForm={showForm}
          setShowForm={setShowForm}
          showBatchEntry={showBatchEntry}
          setShowBatchEntry={setShowBatchEntry}
          showCollectionForm={showCollectionForm}
          setShowCollectionForm={setShowCollectionForm}
          setShowImport={setShowImport}
          setActiveTab={setActiveTab}
        />

        <StockExportProgress 
          exporting={exporting} 
          exportProgress={exportProgress} 
        />

        <StockTabsContainer 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showForm={showForm}
          showBatchEntry={showBatchEntry}
          showCollectionForm={showCollectionForm}
          refreshTrigger={combinedRefreshTrigger}
          dateRange={dateRange}
          handleStockAdded={handleStockAdded}
          handleCollectionAdded={handleCollectionAdded}
        />
        
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Import Stock Data</DialogTitle>
            </DialogHeader>
            <StockImport onComplete={handleImportComplete} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
