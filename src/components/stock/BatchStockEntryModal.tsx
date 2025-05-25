
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Save, X, Calculator } from "lucide-react";

interface BatchStockEntry {
  id: string;
  product_name: string;
  opening_stock: number;
  actual_stock: number;
  closing_stock: number;
  stock_added: number;
  price: number;
}

interface BatchStockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: BatchStockEntry | null;
  onSave: (updatedEntry: BatchStockEntry) => void;
}

export const BatchStockEntryModal: React.FC<BatchStockEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave
}) => {
  const [formData, setFormData] = useState<BatchStockEntry | null>(entry);

  React.useEffect(() => {
    setFormData(entry);
  }, [entry]);

  if (!formData) return null;

  const handleInputChange = (field: keyof BatchStockEntry, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => prev ? {
      ...prev,
      [field]: numValue
    } : null);
  };

  const calculateStockValue = () => {
    return formData.actual_stock * formData.price;
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
            Update Stock Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900">{formData.product_name}</h3>
              <Badge variant="outline" className="mt-1">
                Value: ₹{calculateStockValue().toFixed(2)}
              </Badge>
            </CardContent>
          </Card>

          {/* Stock Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opening_stock">Opening Stock</Label>
              <Input
                id="opening_stock"
                type="number"
                value={formData.opening_stock}
                onChange={(e) => handleInputChange('opening_stock', e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_added">Stock Added</Label>
              <Input
                id="stock_added"
                type="number"
                value={formData.stock_added}
                onChange={(e) => handleInputChange('stock_added', e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_stock" className="text-green-700 font-semibold">
                Actual Stock
              </Label>
              <Input
                id="actual_stock"
                type="number"
                value={formData.actual_stock}
                onChange={(e) => handleInputChange('actual_stock', e.target.value)}
                className="text-lg font-bold border-green-300 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_stock" className="text-orange-700 font-semibold">
                Closing Stock
              </Label>
              <Input
                id="closing_stock"
                type="number"
                value={formData.closing_stock}
                onChange={(e) => handleInputChange('closing_stock', e.target.value)}
                className="text-lg font-bold border-orange-300 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
