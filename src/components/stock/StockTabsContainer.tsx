
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductStockManagement from "./ProductStockManagement";
import StockCreationForm from "./StockCreationForm";

interface StockTabsContainerProps {
  showForm: boolean;
  handleStockAdded: () => void;
  setShowForm: (show: boolean) => void;
}

const StockTabsContainer = ({
  showForm,
  handleStockAdded,
  setShowForm,
}: StockTabsContainerProps) => {
  console.log("StockTabsContainer rendered - showing only stock management");
  
  const handleCloseForm = () => {
    setShowForm(false);
  };
  
  return (
    <div className="w-full">
      <div className="space-y-4">
        <ProductStockManagement onStockUpdated={handleStockAdded} />
      </div>

      {/* Stock Creation Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Stock Entry</DialogTitle>
          </DialogHeader>
          <StockCreationForm 
            onSuccess={handleStockAdded}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTabsContainer;
