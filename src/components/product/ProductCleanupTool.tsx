
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProductCleanupTool = () => {
  const { user } = useAuth();
  const [productName, setProductName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);

  const findProduct = async () => {
    if (!productName.trim() || !user?.id) return;

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${productName.trim()}%`)
        .single();

      if (error) {
        console.error('Error finding product:', error);
        toast.error('Product not found');
        return;
      }

      setProductInfo(product);
      toast.success('Product found! Review the details before deletion.');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error searching for product');
    }
  };

  const deleteProductCompletely = async () => {
    if (!productInfo || !user?.id) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Starting complete deletion of product:', productInfo.name);

      // Step 1: Remove all product-shop assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('product_shops')
        .delete()
        .eq('product_id', productInfo.id)
        .eq('user_id', user.id)
        .select();

      if (assignmentError) {
        console.error('Error removing assignments:', assignmentError);
        throw assignmentError;
      }

      console.log('✅ Removed assignments:', assignments?.length || 0);

      // Step 2: Remove all stock entries
      const { data: stockEntries, error: stockError } = await supabase
        .from('stocks')
        .delete()
        .eq('product_id', productInfo.id)
        .eq('user_id', user.id)
        .select();

      if (stockError) {
        console.error('Error removing stock entries:', stockError);
        throw stockError;
      }

      console.log('✅ Removed stock entries:', stockEntries?.length || 0);

      // Step 3: Remove any low stock alerts
      const { data: alerts, error: alertError } = await supabase
        .from('low_stock_alerts')
        .delete()
        .eq('product_id', productInfo.id)
        .eq('user_id', user.id)
        .select();

      if (alertError) {
        console.error('Error removing alerts:', alertError);
        // Don't throw here, just log
      }

      console.log('✅ Removed alerts:', alerts?.length || 0);

      // Step 4: Remove reorder points
      const { data: reorderPoints, error: reorderError } = await supabase
        .from('reorder_points')
        .delete()
        .eq('product_id', productInfo.id)
        .eq('user_id', user.id)
        .select();

      if (reorderError) {
        console.error('Error removing reorder points:', reorderError);
        // Don't throw here, just log
      }

      console.log('✅ Removed reorder points:', reorderPoints?.length || 0);

      // Step 5: Finally delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productInfo.id)
        .eq('user_id', user.id);

      if (productError) {
        console.error('Error deleting product:', productError);
        throw productError;
      }

      console.log('✅ Successfully deleted product:', productInfo.name);
      toast.success(`Product "${productInfo.name}" has been completely deleted`);
      
      // Reset form
      setProductInfo(null);
      setProductName("");

    } catch (error) {
      console.error('❌ Error during product deletion:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Delete Product Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Warning</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            This will permanently delete the product and all associated data (assignments, stock entries, alerts).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name</Label>
          <Input
            id="product-name"
            placeholder="Enter product name (e.g., Kings)"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findProduct()}
          />
          <Button onClick={findProduct} className="w-full">
            Find Product
          </Button>
        </div>

        {productInfo && (
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
            <h4 className="font-medium">Product Found:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {productInfo.name}</p>
              <p><strong>Category:</strong> {productInfo.category}</p>
              <p><strong>Price:</strong> ₹{productInfo.price}</p>
              <p><strong>SKU:</strong> {productInfo.sku || 'N/A'}</p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete This Product"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product Permanently</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{productInfo.name}"? This action will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Remove all store assignments</li>
                      <li>Delete all stock entries</li>
                      <li>Remove alerts and reorder points</li>
                      <li>Permanently delete the product</li>
                    </ul>
                    <strong className="text-red-600">This action cannot be undone.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteProductCompletely}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCleanupTool;
