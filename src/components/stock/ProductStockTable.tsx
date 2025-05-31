
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Minus } from "lucide-react";
import { AssignedProduct } from "./hooks/useAssignedProducts";

interface ProductStockTableProps {
  filteredProducts: AssignedProduct[];
  isAdmin: boolean;
  addStockQuantities: Record<string, number>;
  setAddStockQuantities: (quantities: Record<string, number>) => void;
  updatingStock: Record<string, boolean>;
  onAddStock: (productId: string, assignmentId: string) => void;
  onEditStock: (product: AssignedProduct) => void;
  onRemoveProduct: (assignmentId: string, productName: string) => void;
  onDeleteStock: (productId: string, shopId: string) => void;
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
  onDeleteStock
}: ProductStockTableProps) => {
  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setAddStockQuantities({
      ...addStockQuantities,
      [productId]: quantity
    });
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Store</TableHead>
            <TableHead className="text-right">Opening Stock</TableHead>
            <TableHead className="text-right">Stock Added</TableHead>
            <TableHead className="text-right">Sold</TableHead>
            <TableHead className="text-right">Expected Closing</TableHead>
            <TableHead className="text-right">Actual Stock</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead className="text-center">Add Stock</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => {
            return (
              <TableRow key={`${product.assignment_id}-${product.shop_id}`}>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">₹{product.price}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell>{product.shop_name}</TableCell>
                <TableCell className="text-right">{product.opening_stock || 0}</TableCell>
                <TableCell className="text-right">{product.stock_added || 0}</TableCell>
                <TableCell className="text-right">{product.sold_quantity || 0}</TableCell>
                <TableCell className="text-right">{product.expected_closing || 0}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-blue-600">
                    {product.actual_stock !== null && product.actual_stock !== undefined ? product.actual_stock : 0}
                  </span>
                </TableCell>
                <TableCell className={`text-right ${getVarianceColor(product.variance || 0)}`}>
                  {product.variance !== undefined ? (product.variance > 0 ? `+${product.variance}` : product.variance) : '0'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={addStockQuantities[product.id] || ""}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="w-20 h-8"
                      placeholder="0"
                    />
                    <Button
                      size="sm"
                      onClick={() => onAddStock(product.id, product.assignment_id)}
                      disabled={!addStockQuantities[product.id] || updatingStock[product.id]}
                      className="h-8 px-2"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStock(product)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveProduct(product.assignment_id, product.name)}
                      className="h-8 px-2 text-orange-600 hover:text-orange-700"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteStock(product.id, product.shop_id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found with current filters
        </div>
      )}
    </div>
  );
};

export default ProductStockTable;
