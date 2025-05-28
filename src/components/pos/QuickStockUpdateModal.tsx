
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface QuickStockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedShopId: string;
  onStockUpdated: () => void;
}

export const QuickStockUpdateModal = ({
  isOpen,
  onClose,
  products,
  selectedShopId,
  onStockUpdated
}: QuickStockUpdateModalProps) => {
  const { user } = useAuth();
  const [stockValues, setStockValues] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStockValueChange = (productId: string, value: string) => {
    setStockValues(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleUpdateStock = async () => {
    if (!selectedShopId || !user) {
      toast.error("Please select a shop and ensure you're logged in");
      return;
    }

    const updates = Object.entries(stockValues).filter(([_, value]) => 
      value.trim() !== "" && !isNaN(Number(value)) && Number(value) >= 0
    );

    if (updates.length === 0) {
      toast.error("Please enter valid stock values");
      return;
    }

    setIsUpdating(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      for (const [productId, value] of updates) {
        const actualStock = parseInt(value);

        // Check if stock entry exists for today
        const { data: existingStock, error: fetchError } = await supabase
          .from('stocks')
          .select('*')
          .eq('product_id', productId)
          .eq('shop_id', selectedShopId)
          .eq('stock_date', today)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching existing stock:', fetchError);
          continue;
        }

        if (existingStock) {
          // Update existing stock entry
          const { error: updateError } = await supabase
            .from('stocks')
            .update({
              actual_stock: actualStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStock.id);

          if (updateError) {
            console.error('Error updating stock:', updateError);
            toast.error(`Failed to update stock for ${products.find(p => p.id === productId)?.name}`);
          }
        } else {
          // Create new stock entry
          const { error: insertError } = await supabase
            .from('stocks')
            .insert({
              product_id: productId,
              shop_id: selectedShopId,
              stock_date: today,
              opening_stock: actualStock,
              closing_stock: actualStock,
              actual_stock: actualStock,
              stock_added: 0,
              user_id: user.id
            });

          if (insertError) {
            console.error('Error creating stock entry:', insertError);
            toast.error(`Failed to create stock entry for ${products.find(p => p.id === productId)?.name}`);
          }
        }
      }

      toast.success(`Updated stock for ${updates.length} products`);
      setStockValues({});
      onStockUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setStockValues({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Quick Stock Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No products available for stock update</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        Current: {product.quantity || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`stock-${product.id}`} className="text-sm font-medium">
                      Actual Stock:
                    </Label>
                    <Input
                      id={`stock-${product.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={stockValues[product.id] || ""}
                      onChange={(e) => handleStockValueChange(product.id, e.target.value)}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStock}
            disabled={isUpdating || products.length === 0}
          >
            {isUpdating ? "Updating..." : "Update Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
