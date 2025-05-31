
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  sold_quantity?: number;
  expected_closing?: number;
  actual_stock?: number;
  variance?: number;
  shop_id: string;
  shop_name: string;
}

interface Shop {
  id: string;
  name: string;
}

interface StockEditDialogProps {
  editingProduct: AssignedProduct | null;
  setEditingProduct: (product: AssignedProduct | null) => void;
  editStockValues: {
    opening_stock: number;
    stock_added: number;
    actual_stock: number;
  };
  setEditStockValues: (values: { opening_stock: number; stock_added: number; actual_stock: number } | ((prev: { opening_stock: number; stock_added: number; actual_stock: number }) => { opening_stock: number; stock_added: number; actual_stock: number })) => void;
  selectedShop: string;
  shops: Shop[];
  onUpdateStock: () => void;
  isUpdatingStock: boolean;
}

const StockEditDialog = ({
  editingProduct,
  setEditingProduct,
  editStockValues,
  setEditStockValues,
  selectedShop,
  shops,
  onUpdateStock,
  isUpdatingStock,
}: StockEditDialogProps) => {
  return (
    <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Stock for {editingProduct?.name}</DialogTitle>
        </DialogHeader>
        {editingProduct && (
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">Store: {editingProduct.shop_name}</div>
              <div className="text-sm text-muted-foreground">Category: {editingProduct.category}</div>
              <div className="text-sm text-muted-foreground">Sold Today: {editingProduct.sold_quantity || 0}</div>
              <div className="text-sm font-medium text-blue-600">Expected Closing: {editingProduct.expected_closing || 0}</div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Opening Stock</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={editStockValues.opening_stock} 
                  onChange={(e) => setEditStockValues({
                    ...editStockValues,
                    opening_stock: Number(e.target.value)
                  })}
                />
                <div className="text-xs text-muted-foreground">
                  This should be yesterday's actual stock
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Stock Added Today</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={editStockValues.stock_added} 
                  onChange={(e) => setEditStockValues({
                    ...editStockValues,
                    stock_added: Number(e.target.value)
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-orange-600">Actual Stock (Physical Count)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={editStockValues.actual_stock || ''} 
                  onChange={(e) => setEditStockValues({
                    ...editStockValues,
                    actual_stock: Number(e.target.value) || 0
                  })}
                  placeholder={`Expected: ${editingProduct.expected_closing || 0}`}
                />
                <div className="text-xs text-muted-foreground">
                  <strong>Only enter if different from expected closing.</strong> Leave empty if physical count matches expected closing ({editingProduct.expected_closing || 0}).
                </div>
                {editStockValues.actual_stock && editingProduct.expected_closing && (
                  <div className="text-xs">
                    {editStockValues.actual_stock < editingProduct.expected_closing && (
                      <span className="text-red-600 font-medium">
                        Shortage: {editingProduct.expected_closing - editStockValues.actual_stock} units
                      </span>
                    )}
                    {editStockValues.actual_stock > editingProduct.expected_closing && (
                      <span className="text-orange-600 font-medium">
                        Excess: {editStockValues.actual_stock - editingProduct.expected_closing} units
                      </span>
                    )}
                    {editStockValues.actual_stock === editingProduct.expected_closing && (
                      <span className="text-green-600 font-medium">
                        ✓ Matches expected closing
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
          <Button onClick={onUpdateStock} disabled={isUpdatingStock}>
            {isUpdatingStock ? "Updating..." : "Update Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockEditDialog;
