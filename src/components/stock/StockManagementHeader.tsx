
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Store } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Shop {
  id: string;
  name: string;
  store_code?: string;
}

interface StockManagementHeaderProps {
  stockDate: string;
  setStockDate: (date: string) => void;
  selectedShop: string;
  setSelectedShop: (shopId: string) => void;
  shops: Shop[];
  stockItemsCount: number;
  isAdmin: boolean;
  onLoadInventory: () => void;
}

const StockManagementHeader: React.FC<StockManagementHeaderProps> = ({
  stockDate,
  setStockDate,
  selectedShop,
  setSelectedShop,
  shops,
  stockItemsCount,
  isAdmin,
  onLoadInventory
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
          <Store className="h-5 w-5" />
          Stock Management (HR Stores)
          {stockItemsCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {stockItemsCount} products
            </Badge>
          )}
          {isAdmin && (
            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
              Admin
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div>
            <Label htmlFor="date" className="text-sm">Stock Date</Label>
            <Input
              id="date"
              type="date"
              value={stockDate}
              onChange={(e) => setStockDate(e.target.value)}
              className="h-8"
            />
          </div>

          <div>
            <Label htmlFor="shop" className="text-sm">Select HR Store</Label>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select HR store" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name} {shop.store_code && `(${shop.store_code})`}
                  </SelectItem>
                ))}
                {shops.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No HR stores available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={onLoadInventory}
              disabled={!selectedShop}
              variant="outline"
              size="sm"
              className="w-full h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Load Inventory
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockManagementHeader;
