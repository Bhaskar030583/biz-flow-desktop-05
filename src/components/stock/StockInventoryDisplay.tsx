
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package2 } from "lucide-react";
import StockItemCard from "./StockItemCard";

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  openingStock: number;
  actualStock: number;
  availableStock: number;
  stockAdded: number;
}

interface StockInventoryDisplayProps {
  stockItems: StockItem[];
  totalStockAdded: number;
  quickAddMode: boolean;
  isAdmin: boolean;
  onUpdateStock: (productId: string, field: keyof StockItem, value: number) => void;
}

const StockInventoryDisplay: React.FC<StockInventoryDisplayProps> = ({
  stockItems,
  totalStockAdded,
  quickAddMode,
  isAdmin,
  onUpdateStock
}) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package2 className="h-4 w-4" />
          Store Inventory ({stockItems.length})
          {totalStockAdded > 0 && (
            <Badge variant="default" className="bg-green-600 ml-2">
              +{totalStockAdded} items
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className={`space-y-3 ${quickAddMode ? 'max-h-96' : 'max-h-80'} overflow-y-auto`}>
          {stockItems.map(item => (
            <StockItemCard
              key={item.productId}
              item={item}
              quickAddMode={quickAddMode}
              isAdmin={isAdmin}
              onUpdateStock={onUpdateStock}
            />
          ))}
          {stockItems.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Package2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No products assigned to this store</p>
              {!quickAddMode && (
                <p className="text-xs">Products must be assigned to this store first</p>
              )}
              {quickAddMode && (
                <p className="text-xs">Exit Quick Mode to assign products to this store</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockInventoryDisplay;
