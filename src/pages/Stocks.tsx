import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataSync } from "@/context/DataSyncContext";
import { useDataSyncActions } from "@/hooks/useDataSyncActions";
import StockHeader from "@/components/stock/StockHeader";
import StockTabsContainer from "@/components/stock/StockTabsContainer";
import { useSearchParams } from "react-router-dom";

const Stocks = () => {
  const { refreshTrigger } = useDataSync();
  const { syncAfterStockChange } = useDataSyncActions();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("management");
  const [stockCount, setStockCount] = useState(0);

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
        setShowForm={setShowForm}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default Stocks;
