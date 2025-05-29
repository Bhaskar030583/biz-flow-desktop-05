
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
}

interface AssignedProductsListProps {
  assignedProducts: Product[];
  selectedShop: string;
  onProductDeassigned: () => void;
}

const AssignedProductsList: React.FC<AssignedProductsListProps> = ({
  assignedProducts,
  selectedShop,
  onProductDeassigned
}) => {
  const { user } = useAuth();
  const [deassigning, setDeassigning] = useState<Record<string, boolean>>({});

  const handleDeassignProduct = async (productId: string, productName: string) => {
    if (!selectedShop || !user?.id) {
      toast.error("Missing shop or user information");
      return;
    }

    setDeassigning(prev => ({ ...prev, [productId]: true }));

    try {
      // Remove the product assignment from product_shops table
      const { error } = await supabase
        .from('product_shops')
        .delete()
        .eq('product_id', productId)
        .eq('shop_id', selectedShop)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`${productName} has been de-assigned from the store`);
      onProductDeassigned();
    } catch (error) {
      console.error('Error de-assigning product:', error);
      toast.error('Failed to de-assign product');
    } finally {
      setDeassigning(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (assignedProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Minus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Products Assigned</h3>
            <p className="text-sm text-gray-400">
              Use the "Assign Products" button above to assign products to this store.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Assigned Products ({assignedProducts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h4>
                  <Badge variant="outline" className="mt-1">
                    {product.category}
                  </Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      disabled={deassigning[product.id]}
                    >
                      {deassigning[product.id] ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>De-assign Product</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to de-assign "{product.name}" from this store? 
                        This will remove the product from the store's inventory.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeassignProduct(product.id, product.name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        De-assign
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">₹{product.price.toFixed(2)}</span>
                </div>
                {product.cost_price && (
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-medium">₹{product.cost_price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedProductsList;
