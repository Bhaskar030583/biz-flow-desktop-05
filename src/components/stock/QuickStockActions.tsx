
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, RotateCcw, Plus } from "lucide-react";

interface QuickStockActionsProps {
  quickAddMode: boolean;
  setQuickAddMode: (mode: boolean) => void;
  totalStockAdded: number;
  onClearAllAdditions: () => void;
  onBulkAdd: (amount: number) => void;
  hasStockItems: boolean;
}

const QuickStockActions: React.FC<QuickStockActionsProps> = ({
  quickAddMode,
  setQuickAddMode,
  totalStockAdded,
  onClearAllAdditions,
  onBulkAdd,
  hasStockItems
}) => {
  const quickAddAmounts = [5, 10, 20, 50];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setQuickAddMode(!quickAddMode)}
          variant={quickAddMode ? "default" : "outline"}
          size="sm"
          className="h-8"
        >
          <Zap className="h-3 w-3 mr-1" />
          Quick Mode
        </Button>
        
        {totalStockAdded > 0 && (
          <Badge variant="default" className="bg-green-600">
            +{totalStockAdded} to add
          </Badge>
        )}
      </div>

      {quickAddMode && hasStockItems && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="mb-3">
            <span className="text-sm font-medium text-blue-800">Quick Add to All:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickAddAmounts.map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => onBulkAdd(amount)}
                className="h-8 text-sm border-blue-300 hover:bg-blue-100"
              >
                +{amount}
              </Button>
            ))}
          </div>
        </div>
      )}

      {totalStockAdded > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={onClearAllAdditions}
            variant="outline"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickStockActions;
