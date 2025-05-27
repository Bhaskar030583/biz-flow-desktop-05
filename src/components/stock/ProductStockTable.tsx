
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
  console.log('=== ProductStockTable RENDER ===');
  console.log('Props received:', {
    filteredProductsCount: filteredProducts.length,
    isAdmin,
    onEditStock: typeof onEditStock,
    onRemoveProduct: typeof onRemoveProduct,
    onDeleteStock: typeof onDeleteStock
  });

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

  const handleDeleteStock = (productId: string, productName: string) => {
    console.log('=== HANDLE DELETE STOCK ===');
    console.log('Product ID:', productId);
    console.log('Product Name:', productName);
    console.log('onDeleteStock function type:', typeof onDeleteStock);
    
    if (typeof onDeleteStock === 'function') {
      console.log('Calling onDeleteStock...');
      onDeleteStock(productId, productName);
      console.log('onDeleteStock called successfully');
    } else {
      console.error('onDeleteStock is not a function!', onDeleteStock);
      toast.error('Delete function is not available');
    }
  };

  const handleRemoveProduct = (assignmentId: string, productName: string) => {
    console.log('=== HANDLE REMOVE PRODUCT ===');
    console.log('Assignment ID:', assignmentId);
    console.log('Product Name:', productName);
    console.log('onRemoveProduct function type:', typeof onRemoveProduct);
    
    if (typeof onRemoveProduct === 'function') {
      console.log('Calling onRemoveProduct...');
      onRemoveProduct(assignmentId, productName);
      console.log('onRemoveProduct called successfully');
    } else {
      console.error('onRemoveProduct is not a function!', onRemoveProduct);
      toast.error('Remove function is not available');
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
            console.log('=== RENDERING PRODUCT ROW ===', product.name);
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('=== EDIT BUTTON CLICKED ===');
                        console.log('Product:', product.name, product.id);
                        console.log('onEditStock function type:', typeof onEditStock);
                        console.log('About to call onEditStock with product:', product);
                        
                        if (typeof onEditStock === 'function') {
                          console.log('Calling onEditStock...');
                          onEditStock(product);
                          console.log('onEditStock called successfully');
                        } else {
                          console.error('onEditStock is not a function!', onEditStock);
                          toast.error('Edit function is not available');
                        }
                      }}
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
                              onClick={() => handleDeleteStock(product.id, product.name)}
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
                            onClick={() => handleRemoveProduct(product.assignment_id, product.name)}
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
