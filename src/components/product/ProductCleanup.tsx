
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  quantity: number;
  created_at: string;
}

const ProductCleanup = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to fetch products",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked 
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? products.map(p => p.id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    setDeleting(true);
    
    try {
      // First check if any products have assignments or stock
      for (const productId of selectedProducts) {
        // Check product assignments
        const { data: assignments } = await supabase
          .from("product_shops")
          .select("id")
          .eq("product_id", productId);
        
        if (assignments && assignments.length > 0) {
          // Delete assignments first
          await supabase
            .from("product_shops")
            .delete()
            .eq("product_id", productId);
        }
        
        // Check and delete stock entries
        const { data: stocks } = await supabase
          .from("stocks")
          .select("id")
          .eq("product_id", productId);
        
        if (stocks && stocks.length > 0) {
          await supabase
            .from("stocks")
            .delete()
            .eq("product_id", productId);
        }
        
        // Check and delete bill items
        const { data: billItems } = await supabase
          .from("bill_items")
          .select("id")
          .eq("product_id", productId);
        
        if (billItems && billItems.length > 0) {
          await supabase
            .from("bill_items")
            .delete()
            .eq("product_id", productId);
        }
      }
      
      // Finally delete the products
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProducts);
      
      if (error) throw error;
      
      toast({
        title: "Products deleted successfully",
        description: `${selectedProducts.length} products and their related data have been deleted.`,
      });
      
      setSelectedProducts([]);
      fetchProducts();
      setShowConfirm(false);
      
    } catch (error: any) {
      console.error("Error deleting products:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete products",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading products...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Product Cleanup Tool
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select test products to delete (like "kinhs", "lights", etc.). This will also remove all related stock entries, assignments, and bill items.
        </p>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No products found.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id="select-all"
                checked={selectedProducts.length === products.length}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({products.length} products)
              </label>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-2 p-2 border rounded">
                  <Checkbox
                    id={product.id}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                  />
                  <label htmlFor={product.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({product.category})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ₹{product.price} | Qty: {product.quantity}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            {selectedProducts.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {selectedProducts.length} products selected for deletion
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirm(true)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        )}
        
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedProducts.length} product(s)? 
                This will permanently remove:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>The selected products</li>
                  <li>All stock entries for these products</li>
                  <li>All store assignments for these products</li>
                  <li>All bill items for these products</li>
                </ul>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ProductCleanup;
