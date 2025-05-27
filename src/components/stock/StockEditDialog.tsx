
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
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
}

interface Shop {
  id: string;
  name: string;
}

interface StockEditDialogProps {
  editingProduct: AssignedProduct | null;
  setEditingProduct: (product: AssignedProduct | null) => void;
  editStockValues: {
    stock_added: number;
    actual_stock: number;
  };
  setEditStockValues: (values: { stock_added: number; actual_stock: number } | ((prev: { stock_added: number; actual_stock: number }) => { stock_added: number; actual_stock: number })) => void;
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
              <div className="text-sm text-muted-foreground">Store: {shops.find(shop => shop.id === selectedShop)?.name}</div>
              <div className="text-sm text-muted-foreground">Category: {editingProduct.category}</div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Stock Added</Label>
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
                <Label className="text-sm font-medium">Actual Stock</Label>
                <Input 
                  type="number" 
                  min="0" 
                  value={editStockValues.actual_stock} 
                  onChange={(e) => setEditStockValues({
                    ...editStockValues,
                    actual_stock: Number(e.target.value)
                  })}
                />
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
