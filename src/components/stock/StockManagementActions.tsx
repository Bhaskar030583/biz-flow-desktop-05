
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StockManagementActionsProps {
  loading: boolean;
  selectedShop: string;
  stockItemsCount: number;
  onSave: () => void;
  onCancel: () => void;
}

const StockManagementActions: React.FC<StockManagementActionsProps> = ({
  loading,
  selectedShop,
  stockItemsCount,
  onSave,
  onCancel
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
      <Button variant="outline" onClick={onCancel} disabled={loading} size="sm">
        Cancel
      </Button>
      <Button 
        onClick={onSave}
        disabled={loading || !selectedShop || stockItemsCount === 0}
        className="bg-green-600 hover:bg-green-700"
        size="sm"
      >
        {loading ? (
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Save className="h-3 w-3 mr-1" />
        )}
        Save Store Inventory
      </Button>
    </div>
  );
};

export default StockManagementActions;
