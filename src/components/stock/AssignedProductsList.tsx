import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      console.log('🗑️ Deassigning product:', { productId, selectedShop, userId: user.id });

      // First, try to delete using hr_shop_id
      let { data: deletedRows, error } = await supabase
        .from('product_shops')
        .delete()
        .eq('product_id', productId)
        .eq('hr_shop_id', selectedShop)
        .eq('user_id', user.id)
        .select();

      // If no rows were deleted with hr_shop_id, try with shop_id
      if (!error && (!deletedRows || deletedRows.length === 0)) {
        console.log('🔄 No rows found with hr_shop_id, trying with shop_id...');
        const { data: fallbackDeleted, error: fallbackError } = await supabase
          .from('product_shops')
          .delete()
          .eq('product_id', productId)
          .eq('shop_id', selectedShop)
          .eq('user_id', user.id)
          .select();

        if (fallbackError) {
          throw fallbackError;
        }
        
        deletedRows = fallbackDeleted;
      }

      if (error) {
        throw error;
      }

      if (!deletedRows || deletedRows.length === 0) {
        toast.error(`Product assignment not found. The product might already be deassigned.`);
        // Still call onProductDeassigned to refresh the list
        onProductDeassigned();
        return;
      }

      console.log('✅ Successfully deassigned product:', deletedRows);
      toast.success(`${productName} has been de-assigned from the store`);
      onProductDeassigned();
    } catch (error) {
      console.error('❌ Error de-assigning product:', error);
      toast.error('Failed to de-assign product. Please try again.');
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="w-[100px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.cost_price ? `₹${product.cost_price.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignedProductsList;
