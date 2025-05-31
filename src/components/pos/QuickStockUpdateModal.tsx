
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { updateProductStock } from "@/services/stockService";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

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

export const QuickStockUpdateModal: React.FC<QuickStockUpdateModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedShopId,
  onStockUpdated
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setStockUpdates(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleUpdateStock = async (productId: string) => {
    const quantity = stockUpdates[productId];
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsUpdating(true);
    try {
      await updateProductStock(productId, selectedShopId, quantity, user.id);
      
      toast.success("Stock updated successfully");
      
      // Clear the input for this product
      setStockUpdates(prev => ({
        ...prev,
        [productId]: 0
      }));
      
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
      
      // Notify parent to refresh data
      onStockUpdated();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error("Failed to update stock");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAllStock = async () => {
    const updatesNeeded = Object.entries(stockUpdates).filter(([_, quantity]) => quantity > 0);
    
    if (updatesNeeded.length === 0) {
      toast.error("No stock updates to process");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setIsUpdating(true);
    try {
      for (const [productId, quantity] of updatesNeeded) {
        await updateProductStock(productId, selectedShopId, quantity, user.id);
      }
      
      toast.success(`Updated stock for ${updatesNeeded.length} products`);
      setStockUpdates({});
      
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-products'] });
      
      onStockUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error("Failed to update some stock items");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchTerm("");
    setStockUpdates({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Stock Update</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Add stock quantities for products below. This will increase the current stock levels.
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
            />
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No products available for this store
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No products match your search
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="border border-gray-200 dark:border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                            {product.category}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ₹{Number(product.price).toFixed(2)}
                          </span>
                          {product.quantity !== undefined && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                product.quantity > 10 
                                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' 
                                  : product.quantity > 0 
                                    ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                                    : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                              }`}
                            >
                              Current: {product.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Label htmlFor={`stock-${product.id}`} className="sr-only">
                            Add Stock
                          </Label>
                          <Input
                            id={`stock-${product.id}`}
                            type="number"
                            min="0"
                            placeholder="0"
                            value={stockUpdates[product.id] || ''}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            className="text-center bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStock(product.id)}
                          disabled={!stockUpdates[product.id] || stockUpdates[product.id] <= 0 || isUpdating}
                          className="px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAllStock}
              disabled={isUpdating || Object.values(stockUpdates).every(q => !q || q <= 0)}
            >
              {isUpdating ? "Updating..." : "Update All Stock"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
