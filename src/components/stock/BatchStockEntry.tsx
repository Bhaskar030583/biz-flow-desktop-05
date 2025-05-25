
import React from "react";
import NewStockManagement from "./NewStockManagement";

interface BatchStockEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockEntry: React.FC<BatchStockEntryProps> = ({ onSuccess, onCancel }) => {
  return <NewStockManagement onSuccess={onSuccess} onCancel={onCancel} />;
};

export default BatchStockEntry;
