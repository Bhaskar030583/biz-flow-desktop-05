
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Edit, UserMinus } from "lucide-react";

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
  setAddStockQuantities: (quantities: Record<string, string>) => void;
  updatingStock: Record<string, boolean>;
  onAddStock: (productId: string) => void;
  onEditStock: (product: AssignedProduct) => void;
  onRemoveProduct: (assignmentId: string, productName: string) => void;
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
            {isAdmin && <TableHead>Add Stock</TableHead>}
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
                {isAdmin && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={addStockQuantities[product.id] || ""}
                        onChange={(e) => setAddStockQuantities(prev => ({
                          ...prev,
                          [product.id]: e.target.value
                        }))}
                        className="w-16 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddStock(product.id)}
                        disabled={updatingStock[product.id] || !addStockQuantities[product.id]}
                        className="h-8 px-2"
                      >
                        <Package className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditStock(product)}
                      className="h-8 px-2"
                      title="Edit stock values"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveProduct(product.assignment_id, product.name)}
                      className="h-8 px-2"
                      title="Deassign product from store"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
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
