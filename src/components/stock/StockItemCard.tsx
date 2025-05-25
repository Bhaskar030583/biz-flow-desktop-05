
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Minus, Plus } from "lucide-react";

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  openingStock: number;
  actualStock: number;
  availableStock: number;
  stockAdded: number;
}

interface StockItemCardProps {
  item: StockItem;
  quickAddMode: boolean;
  isAdmin: boolean;
  onUpdateStock: (productId: string, field: keyof StockItem, value: number) => void;
}

const StockItemCard: React.FC<StockItemCardProps> = ({
  item,
  quickAddMode,
  isAdmin,
  onUpdateStock
}) => {
  const adjustStockAdded = (delta: number) => {
    const newValue = Math.max(0, item.stockAdded + delta);
    onUpdateStock(item.productId, 'stockAdded', newValue);
  };

  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mb-2">
        <div className="font-medium text-sm">{item.productName}</div>
        <div className="text-xs text-gray-500">{item.category}</div>
      </div>
      
      <div className={`grid gap-2 ${quickAddMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {!quickAddMode && (
          <>
            <div>
              <Label htmlFor={`opening-${item.productId}`} className="text-xs flex items-center gap-1">
                Opening Stock
                {!isAdmin && <Lock className="h-3 w-3" />}
              </Label>
              <Input
                id={`opening-${item.productId}`}
                type="number"
                value={item.openingStock}
                onChange={(e) => onUpdateStock(item.productId, 'openingStock', parseInt(e.target.value) || 0)}
                className="h-7 text-sm"
                min="0"
                disabled={!isAdmin}
                title={!isAdmin ? "Only admins can edit opening stock" : ""}
              />
            </div>
            <div>
              <Label htmlFor={`actual-${item.productId}`} className="text-xs">Actual Stock</Label>
              <Input
                id={`actual-${item.productId}`}
                type="number"
                value={item.actualStock}
                onChange={(e) => onUpdateStock(item.productId, 'actualStock', parseInt(e.target.value) || 0)}
                className="h-7 text-sm"
                min="0"
              />
            </div>
          </>
        )}
        
        <div className={quickAddMode ? 'col-span-1' : ''}>
          <Label htmlFor={`stock-added-${item.productId}`} className="text-xs text-blue-600 font-medium">
            Stock to Add
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustStockAdded(-1)}
              disabled={item.stockAdded <= 0}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id={`stock-added-${item.productId}`}
              type="number"
              value={item.stockAdded}
              onChange={(e) => onUpdateStock(item.productId, 'stockAdded', parseInt(e.target.value) || 0)}
              className="h-7 text-sm text-center border-blue-300 focus:border-blue-500"
              min="0"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => adjustStockAdded(1)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {item.stockAdded > 0 && (
            <Badge variant="secondary" className="text-xs mt-1">
              +{item.stockAdded} units
            </Badge>
          )}
        </div>
        
        {!quickAddMode && (
          <div>
            <Label htmlFor={`available-${item.productId}`} className="text-xs">Available Stock</Label>
            <Input
              id={`available-${item.productId}`}
              type="number"
              value={item.availableStock}
              onChange={(e) => onUpdateStock(item.productId, 'availableStock', parseInt(e.target.value) || 0)}
              className="h-7 text-sm"
              min="0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockItemCard;
