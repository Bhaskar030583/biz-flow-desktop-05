
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
}

interface ProductAssignmentFormProps {
  showAssignForm: boolean;
  unassignedProducts: Product[];
  selectedProductToAssign: string;
  setSelectedProductToAssign: (productId: string) => void;
  initialStockQuantity: string;
  setInitialStockQuantity: (quantity: string) => void;
  onAssignProduct: () => void;
  onCancel: () => void;
}

const ProductAssignmentForm = ({
  showAssignForm,
  unassignedProducts,
  selectedProductToAssign,
  setSelectedProductToAssign,
  initialStockQuantity,
  setInitialStockQuantity,
  onAssignProduct,
  onCancel,
}: ProductAssignmentFormProps) => {
  if (!showAssignForm) return null;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Assign Product with Initial Stock</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={selectedProductToAssign} onValueChange={setSelectedProductToAssign}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900 shadow-sm hover:border-slate-400">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-300 shadow-lg z-50">
                {unassignedProducts.map(product => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100 cursor-pointer"
                  >
                    {product.name} - {product.category}
                  </SelectItem>
                ))}
                {unassignedProducts.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-slate-600">
                    No unassigned products available
                  </div>
                )}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              placeholder="Initial stock quantity"
              value={initialStockQuantity}
              onChange={(e) => setInitialStockQuantity(e.target.value)}
              className="bg-white"
            />
            <div className="flex gap-2">
              <Button onClick={onAssignProduct} className="bg-green-600 hover:bg-green-700">
                Assign
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductAssignmentForm;
