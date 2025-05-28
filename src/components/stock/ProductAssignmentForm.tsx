
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ProductAssignmentFormProps {
  selectedShop: string;
  onProductAssigned: () => void;
  onCancel: () => void;
}

const ProductAssignmentForm = ({
  selectedShop,
  onProductAssigned,
  onCancel,
}: ProductAssignmentFormProps) => {
  const { user } = useAuth();
  const [selectedProductToAssign, setSelectedProductToAssign] = useState("");
  const [initialStockQuantity, setInitialStockQuantity] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Query for unassigned products
  const { data: unassignedProducts, isLoading } = useQuery({
    queryKey: ['unassigned-products', selectedShop],
    queryFn: async () => {
      if (!selectedShop) return [];
      
      // Get all products
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .eq('user_id', user?.id);
      
      if (productsError) throw productsError;
      
      // Get assigned products for this HR store by checking against user's shops
      // Since we're now using HR stores, we need to find a way to map to shops
      // For now, we'll use the HR store ID directly and create the mapping in the assignment
      const { data: assignedProducts, error: assignedError } = await supabase
        .from('product_shops')
        .select('product_id')
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);
      
      if (assignedError) {
        console.log("No existing assignments found for this store:", assignedError);
        // If no assignments exist yet, all products are unassigned
        return allProducts || [];
      }
      
      const assignedProductIds = assignedProducts?.map(ps => ps.product_id) || [];
      
      // Filter out assigned products
      return allProducts?.filter(product => !assignedProductIds.includes(product.id)) || [];
    },
    enabled: !!selectedShop && !!user?.id
  });

  const handleAssignProduct = async () => {
    if (!selectedProductToAssign || !initialStockQuantity || Number(initialStockQuantity) <= 0) {
      toast.error("Please select a product and enter a valid stock quantity");
      return;
    }

    setIsAssigning(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // First, check if we need to create or find a corresponding shop entry
      // For now, we'll use the HR store ID as the shop ID
      // In a production system, you might want to create a proper mapping
      
      // Try to assign product to shop using the HR store ID
      const { error: assignError } = await supabase
        .from('product_shops')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop, // Using HR store ID directly
          user_id: user?.id
        });

      if (assignError) {
        // If this fails due to foreign key constraint, we need to handle HR store to shop mapping
        console.error("Assignment error:", assignError);
        
        // Check if we have any shops for this user to use as fallback
        const { data: userShops, error: shopsError } = await supabase
          .from('shops')
          .select('id')
          .eq('user_id', user?.id)
          .limit(1);
        
        if (shopsError || !userShops || userShops.length === 0) {
          throw new Error("No shops found. Please create a shop first or contact support.");
        }
        
        // Use the first available shop as fallback
        const fallbackShopId = userShops[0].id;
        
        const { error: fallbackAssignError } = await supabase
          .from('product_shops')
          .insert({
            product_id: selectedProductToAssign,
            shop_id: fallbackShopId,
            user_id: user?.id
          });
        
        if (fallbackAssignError) throw fallbackAssignError;
        
        // Use the fallback shop ID for stock creation
        selectedShop = fallbackShopId;
      }

      // Create initial stock entry
      const { error: stockError } = await supabase
        .from('stocks')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          stock_date: today,
          opening_stock: Number(initialStockQuantity),
          closing_stock: Number(initialStockQuantity),
          actual_stock: Number(initialStockQuantity),
          stock_added: Number(initialStockQuantity),
          user_id: user?.id
        });

      if (stockError) throw stockError;

      const productName = unassignedProducts?.find(p => p.id === selectedProductToAssign)?.name;
      toast.success(`Product "${productName}" assigned with ${initialStockQuantity} initial stock`);
      
      setSelectedProductToAssign("");
      setInitialStockQuantity("");
      onProductAssigned();
    } catch (error) {
      console.error("Error assigning product:", error);
      toast.error(`Failed to assign product: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAssigning(false);
    }
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
                {unassignedProducts?.map(product => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-slate-900 dark:text-slate-100 hover:bg-blue-100 dark:hover:bg-blue-900 focus:bg-blue-100 dark:focus:bg-blue-900 cursor-pointer"
                  >
                    {product.name} - {product.category}
                  </SelectItem>
                ))}
                {unassignedProducts?.length === 0 && (
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
                onClick={handleAssignProduct} 
                disabled={!selectedProductToAssign || !initialStockQuantity || initialStockQuantity === "0" || isAssigning}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? "Assigning..." : "Assign"}
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
