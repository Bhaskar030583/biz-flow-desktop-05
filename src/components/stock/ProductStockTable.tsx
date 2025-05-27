
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, UserMinus, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
}

interface ProductStockTableProps {
  filteredProducts: AssignedProduct[];
  isAdmin: boolean;
  addStockQuantities: Record<string, string>;
  setAddStockQuantities: (quantities: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  updatingStock: Record<string, boolean>;
  onAddStock: (productId: string) => void;
  onEditStock: (product: AssignedProduct) => void;
  onRemoveProduct: (assignmentId: string, productName: string) => void;
  onDeleteStock?: (productId: string, productName: string) => void;
}

const ProductStockTable = ({
  filteredProducts,
  isAdmin,
  addStockQuantities,
  setAddStockQuantities,
  updatingStock,
  onAddStock,
  onEditStock,
  onRemoveProduct,
  onDeleteStock,
}: ProductStockTableProps) => {
  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  const handleEditClick = (product: AssignedProduct) => {
    try {
      if (!product.id || !product.assignment_id) {
        toast.error("Cannot edit stock: Product data is incomplete");
        return;
      }
      onEditStock(product);
    } catch (error) {
      console.error('Error editing stock:', error);
      toast.error("Failed to open edit dialog. Please try again.");
    }
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    try {
      if (!isAdmin) {
        toast.error("Access denied: Only administrators can delete stock entries");
        return;
      }
      if (!onDeleteStock) {
        toast.error("Delete functionality is not available");
        return;
      }
      if (!productId) {
        toast.error("Cannot delete: Product ID is missing");
        return;
      }
      onDeleteStock(productId, productName);
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error("Failed to delete stock entry. Please try again.");
    }
  };

  const handleDeassignClick = (assignmentId: string, productName: string) => {
    try {
      if (!assignmentId) {
        toast.error("Cannot deassign: Assignment ID is missing");
        return;
      }
      if (!productName) {
        toast.error("Cannot deassign: Product name is missing");
        return;
      }
      onRemoveProduct(assignmentId, productName);
    } catch (error) {
      console.error('Error deassigning product:', error);
      toast.error("Failed to deassign product. Please try again.");
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Opening Stock</TableHead>
            <TableHead>Stock Added</TableHead>
            <TableHead>Sold Today</TableHead>
            <TableHead>Expected Closing</TableHead>
            <TableHead>Actual Stock</TableHead>
            <TableHead>Variance</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => {
            const variance = (product.actual_stock || 0) - (product.closing_stock || 0);
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  {product.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getCategoryColor(product.category)}>
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    ₹{product.cost_price ? product.cost_price.toFixed(2) : 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    ₹{product.price.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{product.opening_stock || 0}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-green-600 font-medium">{product.stock_added || 0}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-red-600 font-medium">{product.sold_quantity || 0}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-blue-600 font-medium">{product.closing_stock || 0}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{product.actual_stock || 0}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium ${
                    variance > 0 ? 'text-orange-600' : 
                    variance < 0 ? 'text-red-600' : 
                    'text-green-600'
                  }`}>
                    {variance > 0 ? `+${variance}` : variance}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {product.last_stock_date ? new Date(product.last_stock_date).toLocaleDateString() : 'Never'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(product)}
                      className="h-8 px-2"
                      title="Edit stock values"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isAdmin && onDeleteStock && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                            title="Delete stock entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stock Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all stock entries for "{product.name}"? 
                              This action cannot be undone and will permanently remove all stock data for this product.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteClick(product.id, product.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 px-2"
                          title="Deassign product from store"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deassign Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deassign "{product.name}" from this store? 
                            This will remove the product from this store and delete all associated stock data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeassignClick(product.assignment_id, product.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Deassign
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductStockTable;
