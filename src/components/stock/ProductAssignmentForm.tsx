
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

  const handleAssignClick = () => {
    console.log("Assign button clicked");
    console.log("Selected product:", selectedProductToAssign);
    console.log("Initial stock quantity:", initialStockQuantity);
    
    if (!selectedProductToAssign) {
      console.log("No product selected");
      return;
    }
    
    if (!initialStockQuantity || initialStockQuantity === "0") {
      console.log("No quantity entered or quantity is 0");
      return;
    }
    
    console.log("Calling onAssignProduct");
    onAssignProduct();
  };

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <Label className="text-base font-semibold text-blue-900 dark:text-blue-100">
            Assign Product with Initial Stock
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={selectedProductToAssign} onValueChange={setSelectedProductToAssign}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-600 text-slate-900 dark:text-slate-100 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-600 shadow-lg z-50">
                {unassignedProducts.map(product => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-slate-900 dark:text-slate-100 hover:bg-blue-100 dark:hover:bg-blue-900 focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
                  >
                    {product.name} - {product.category}
                  </SelectItem>
                ))}
                {unassignedProducts.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400">
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
              className="bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAssignClick} 
                disabled={!selectedProductToAssign || !initialStockQuantity || initialStockQuantity === "0"}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950"
              >
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
