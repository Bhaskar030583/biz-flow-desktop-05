
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import NewStockManagement from "./NewStockManagement";

interface BatchStockEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockEntry: React.FC<BatchStockEntryProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate all relevant queries to refresh data across the app
    queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
    queryClient.invalidateQueries({ queryKey: ['stocks'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
    
    onSuccess();
  };

  return <NewStockManagement onSuccess={handleSuccess} onCancel={onCancel} />;
};

export default BatchStockEntry;
