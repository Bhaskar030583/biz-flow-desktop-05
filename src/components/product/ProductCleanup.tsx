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
  sku: string | null;
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
      // Delete in the correct order to avoid foreign key violations
      for (const productId of selectedProducts) {
        console.log(`Deleting all related data for product: ${productId}`);
        
        // 1. Delete bill items first (they reference products)
        const { error: billItemsError } = await supabase
          .from("bill_items")
          .delete()
          .eq("product_id", productId);
        
        if (billItemsError) {
          console.error(`Error deleting bill items for product ${productId}:`, billItemsError);
          // Continue with other deletions even if bill items fail
        }
        
        // 2. Delete sales records
        const { error: salesError } = await supabase
          .from("sales")
          .delete()
          .eq("product_id", productId);
        
        if (salesError) {
          console.error(`Error deleting sales for product ${productId}:`, salesError);
        }
        
        // 3. Delete stock entries
        const { error: stocksError } = await supabase
          .from("stocks")
          .delete()
          .eq("product_id", productId);
        
        if (stocksError) {
          console.error(`Error deleting stocks for product ${productId}:`, stocksError);
        }
        
        // 4. Delete product assignments
        const { error: assignmentsError } = await supabase
          .from("product_shops")
          .delete()
          .eq("product_id", productId);
        
        if (assignmentsError) {
          console.error(`Error deleting assignments for product ${productId}:`, assignmentsError);
        }
        
        // 5. Delete losses
        const { error: lossesError } = await supabase
          .from("losses")
          .delete()
          .eq("product_id", productId);
        
        if (lossesError) {
          console.error(`Error deleting losses for product ${productId}:`, lossesError);
        }
        
        // 6. Delete low stock alerts
        const { error: alertsError } = await supabase
          .from("low_stock_alerts")
          .delete()
          .eq("product_id", productId);
        
        if (alertsError) {
          console.error(`Error deleting alerts for product ${productId}:`, alertsError);
        }
        
        // 7. Delete reorder points
        const { error: reorderError } = await supabase
          .from("reorder_points")
          .delete()
          .eq("product_id", productId);
        
        if (reorderError) {
          console.error(`Error deleting reorder points for product ${productId}:`, reorderError);
        }
        
        // 8. Delete stock requests
        const { error: requestsError } = await supabase
          .from("stock_requests")
          .delete()
          .eq("product_id", productId);
        
        if (requestsError) {
          console.error(`Error deleting stock requests for product ${productId}:`, requestsError);
        }
        
        // 9. Delete stock movements
        const { error: movementsError } = await supabase
          .from("stock_movements")
          .delete()
          .eq("product_id", productId);
        
        if (movementsError) {
          console.error(`Error deleting stock movements for product ${productId}:`, movementsError);
        }
      }
      
      // Finally delete the products themselves
      const { error: productsError } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProducts);
      
      if (productsError) throw productsError;
      
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
          Select products to delete. This will also remove all related stock entries, assignments, bill items, and other related data.
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
                        {product.sku && <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>}
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
                  <li>All bill items for these products</li>
                  <li>All sales records for these products</li>
                  <li>All stock entries for these products</li>
                  <li>All store assignments for these products</li>
                  <li>All losses for these products</li>
                  <li>All stock alerts for these products</li>
                  <li>All reorder points for these products</li>
                  <li>All stock requests for these products</li>
                  <li>All stock movements for these products</li>
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
