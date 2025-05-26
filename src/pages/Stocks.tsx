
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useDataSync } from "@/context/DataSyncContext";
import { useDataSyncActions } from "@/hooks/useDataSyncActions";
import StockHeader from "@/components/stock/StockHeader";
import StockTabsContainer from "@/components/stock/StockTabsContainer";

const Stocks = () => {
  const { refreshTrigger } = useDataSync();
  const { syncAfterStockChange } = useDataSyncActions();
  const [showForm, setShowForm] = useState(false);
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("management");
  const [stockCount, setStockCount] = useState(0);

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
    setRefreshStockTrigger(prev => prev + 1);
    await syncAfterStockChange('create');
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <StockHeader 
          stockCount={stockCount}
          showForm={showForm}
          setShowForm={setShowForm}
          setActiveTab={setActiveTab}
        />

        <StockTabsContainer 
          showForm={showForm}
          handleStockAdded={handleStockAdded}
        />
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
