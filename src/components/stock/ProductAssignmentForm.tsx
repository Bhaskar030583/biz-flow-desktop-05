import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProductAssignmentFormProps {
  selectedShop: string;
  onProductAssigned: () => void;
  onCancel: () => void;
}

const ProductAssignmentForm = ({
  selectedShop,
  onProductAssigned,
  onCancel
}: ProductAssignmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch available products (not yet assigned to this shop)
  const { data: availableProducts, isLoading } = useQuery({
    queryKey: ['available-products', selectedShop],
    queryFn: async () => {
      if (!selectedShop || !user?.id) return [];
      
      // Get all products
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, sku, price')
        .eq('user_id', user.id)
        .order('name');
      
      if (productsError) throw productsError;

      // Get already assigned products for this shop
      const { data: assignedProducts, error: assignedError } = await supabase
        .from('product_shops')
        .select('product_id')
        .eq('hr_shop_id', selectedShop)
        .eq('user_id', user.id);
      
      if (assignedError) throw assignedError;

      const assignedProductIds = assignedProducts?.map(ap => ap.product_id) || [];
      
      // Filter out already assigned products
      return allProducts?.filter(product => 
        !assignedProductIds.includes(product.id)
      ) || [];
    },
    enabled: !!selectedShop && !!user?.id
  });

  const handleAssign = async () => {
    if (!selectedProduct || !selectedShop) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    
    try {
      // Assign product to shop
      const { error: assignError } = await supabase
        .from('product_shops')
        .insert({
          product_id: selectedProduct,
          hr_shop_id: selectedShop,
          shop_id: selectedShop, // Keep for compatibility
          user_id: user?.id
        });

      if (assignError) throw assignError;

      // Create initial stock entry if provided
      if (initialStock && parseInt(initialStock) > 0) {
        const today = new Date().toISOString().split('T')[0];
        const stockQuantity = parseInt(initialStock);
        
        const { error: stockError } = await supabase
          .from('stocks')
          .insert({
            product_id: selectedProduct,
            hr_shop_id: selectedShop,
            shop_id: selectedShop, // Keep for compatibility
            stock_date: today,
            opening_stock: stockQuantity,
            closing_stock: stockQuantity,
            actual_stock: stockQuantity,
            stock_added: stockQuantity,
            user_id: user?.id
          });

        if (stockError) throw stockError;
      }

      toast({
        title: "Success",
        description: `Product assigned successfully${initialStock ? ' with initial stock' : ''}`,
      });

      onProductAssigned();
    } catch (error) {
      console.error('Error assigning product:', error);
      toast({
        title: "Error",
        description: "Failed to assign product",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assign Product with Initial Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading available products...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Product with Initial Stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product">Choose a product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.category} - {product.sku || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-stock">Initial stock quantity</Label>
            <Input
              id="initial-stock"
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              placeholder="Optional initial stock"
            />
          </div>
        </div>

        {availableProducts?.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            All products are already assigned to this store
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedProduct || isAssigning || availableProducts?.length === 0}
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductAssignmentForm;
