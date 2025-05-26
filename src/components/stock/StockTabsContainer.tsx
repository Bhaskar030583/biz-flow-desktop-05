
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductStockManagement from "./ProductStockManagement";
import StockCreationForm from "./StockCreationForm";

interface StockTabsContainerProps {
  showForm: boolean;
  handleStockAdded: () => void;
}

const StockTabsContainer = ({
  showForm,
  handleStockAdded,
}: StockTabsContainerProps) => {
  console.log("StockTabsContainer rendered - showing only stock management");
  
  return (
    <div className="w-full">
      <div className="space-y-4">
        <ProductStockManagement onStockUpdated={handleStockAdded} />
      </div>

      {/* Stock Creation Form Modal */}
      <Dialog open={showForm} onOpenChange={() => {}}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Stock Entry</DialogTitle>
          </DialogHeader>
          <StockCreationForm 
            onSuccess={handleStockAdded}
            onCancel={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTabsContainer;
