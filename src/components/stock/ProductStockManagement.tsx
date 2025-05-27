import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package2, Search, Store, Plus, X, Package, Edit } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
}

interface Shop {
  id: string;
  name: string;
}

interface AssignedProduct extends Product {
  assignment_id: string;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
}

interface ProductStockManagementProps {
  onStockUpdated: () => void;
}

const ProductStockManagement = ({ onStockUpdated }: ProductStockManagementProps) => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProductToAssign, setSelectedProductToAssign] = useState<string>("");
  const [initialStockQuantity, setInitialStockQuantity] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [addStockQuantities, setAddStockQuantities] = useState<Record<string, string>>({});
  const [updatingStock, setUpdatingStock] = useState<Record<string, boolean>>({});
  const [editingProduct, setEditingProduct] = useState<AssignedProduct | null>(null);
  const [editStockValues, setEditStockValues] = useState({
    stock_added: 0,
    actual_stock: 0
  });
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  console.log("ProductStockManagement component loaded - showing products list with store filter and assignment functionality");

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      fetchAssignedProducts();
    }
  }, [selectedShop]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log("Fetching all products for user:", user?.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      
      console.log("Fetched products:", data?.length || 0, "products");
      setAllProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchShops = async () => {
    try {
      console.log("Fetching shops for user:", user?.id);
      
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      
      console.log("Fetched shops:", data?.length || 0, "shops");
      setShops(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
      setLoading(false);
    }
  };

  const fetchAssignedProducts = async () => {
    if (!selectedShop) return;

    try {
      console.log("Fetching assigned products for shop:", selectedShop);
      
      const { data: directData, error: directError } = await supabase
        .from('product_shops')
        .select(`
          id,
          products (
            id,
            name,
            category,
            price,
            cost_price
          )
        `)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);
      
      if (directError) throw directError;
      
      // Get latest stock data and sales data for each assigned product
      const assignedProductsWithStock = await Promise.all(
        (directData || []).map(async (item: any) => {
          // Get latest stock data
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('opening_stock, stock_added, closing_stock, actual_stock, stock_date')
            .eq('product_id', item.products.id)
            .eq('shop_id', selectedShop)
            .order('stock_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (stockError) {
            console.error('Error fetching stock data:', stockError);
          }

          // Get today's sales data for this product
          const today = new Date().toISOString().split('T')[0];
          const { data: billItems, error: billError } = await supabase
            .from('bill_items')
            .select(`
              quantity,
              bills!inner(
                bill_date,
                user_id
              )
            `)
            .eq('product_id', item.products.id)
            .eq('bills.user_id', user?.id)
            .gte('bills.bill_date', today + 'T00:00:00')
            .lte('bills.bill_date', today + 'T23:59:59');

          if (billError) {
            console.error('Error fetching sales data:', billError);
          }

          const soldQuantity = billItems?.reduce((sum, billItem) => sum + billItem.quantity, 0) || 0;
          
          // Calculate closing stock based on sales
          const openingStock = stockData?.opening_stock || 0;
          const calculatedClosingStock = openingStock - soldQuantity;

          return {
            assignment_id: item.id,
            id: item.products.id,
            name: item.products.name,
            category: item.products.category,
            price: item.products.price,
            cost_price: item.products.cost_price,
            opening_stock: openingStock,
            stock_added: stockData?.stock_added || 0,
            closing_stock: calculatedClosingStock,
            actual_stock: stockData?.actual_stock || 0,
            sold_quantity: soldQuantity,
            last_stock_date: stockData?.stock_date || null
          };
        })
      );
      
      console.log("Fetched assigned products with stock:", assignedProductsWithStock.length, "products");
      setAssignedProducts(assignedProductsWithStock);
    } catch (error) {
      console.error('Error fetching assigned products:', error);
      toast.error('Failed to fetch assigned products');
    }
  };

  const assignProductToShop = async () => {
    if (!selectedProductToAssign || !selectedShop || !initialStockQuantity) {
      toast.error('Please select a product, shop, and enter initial stock quantity');
      return;
    }

    const stockQuantity = parseInt(initialStockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      console.log("Assigning product to shop with initial stock:", selectedProductToAssign, selectedShop, stockQuantity);
      
      // First, assign the product to the shop
      const { error: assignError } = await supabase
        .from('product_shops')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          user_id: user?.id
        });
      
      if (assignError) {
        if (assignError.code === '23505') {
          toast.error('Product is already assigned to this shop');
        } else {
          throw assignError;
        }
        return;
      }

      // Then create the initial stock entry
      const { error: stockError } = await supabase
        .from('stocks')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          stock_date: new Date().toISOString().split('T')[0],
          opening_stock: stockQuantity,
          closing_stock: stockQuantity,
          actual_stock: stockQuantity,
          stock_added: 0,
          user_id: user?.id
        });

      if (stockError) {
        console.error('Error creating initial stock entry:', stockError);
        // If stock creation fails, we should remove the product assignment
        await supabase
          .from('product_shops')
          .delete()
          .eq('product_id', selectedProductToAssign)
          .eq('shop_id', selectedShop)
          .eq('user_id', user?.id);
        throw stockError;
      }
      
      toast.success('Product assigned to shop with initial stock successfully');
      setSelectedProductToAssign("");
      setInitialStockQuantity("");
      setShowAssignForm(false);
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error assigning product to shop:', error);
      toast.error('Failed to assign product to shop');
    }
  };

  const removeProductFromShop = async (assignmentId: string) => {
    try {
      console.log("Removing product assignment:", assignmentId);
      
      const { error } = await supabase
        .from('product_shops')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      toast.success('Product removed from shop successfully');
      fetchAssignedProducts();
    } catch (error) {
      console.error('Error removing product from shop:', error);
      toast.error('Failed to remove product from shop');
    }
  };

  const handleAddStock = async (productId: string) => {
    const quantity = addStockQuantities[productId];
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setUpdatingStock(prev => ({ ...prev, [productId]: true }));

    try {
      const today = new Date().toISOString().split('T')[0];
      const stockToAdd = parseInt(quantity);

      // Get current stock data
      const { data: currentStock, error: fetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', productId)
        .eq('shop_id', selectedShop)
        .eq('stock_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (currentStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            stock_added: (currentStock.stock_added || 0) + stockToAdd,
            closing_stock: currentStock.closing_stock + stockToAdd,
            actual_stock: currentStock.actual_stock + stockToAdd
          })
          .eq('id', currentStock.id);

        if (updateError) throw updateError;
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: productId,
            shop_id: selectedShop,
            stock_date: today,
            opening_stock: 0,
            closing_stock: stockToAdd,
            actual_stock: stockToAdd,
            stock_added: stockToAdd,
            user_id: user?.id
          });

        if (insertError) throw insertError;
      }

      toast.success(`Added ${stockToAdd} units to stock`);
      setAddStockQuantities(prev => ({ ...prev, [productId]: "" }));
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleEditStock = (product: AssignedProduct) => {
    setEditingProduct(product);
    setEditStockValues({
      stock_added: product.stock_added || 0,
      actual_stock: product.actual_stock || 0
    });
  };

  const handleUpdateStock = async () => {
    if (!editingProduct) return;

    setIsUpdatingStock(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get current stock data
      const { data: currentStock, error: fetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', editingProduct.id)
        .eq('shop_id', selectedShop)
        .eq('stock_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (currentStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            stock_added: editStockValues.stock_added,
            actual_stock: editStockValues.actual_stock
          })
          .eq('id', currentStock.id);

        if (updateError) throw updateError;
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: editingProduct.id,
            shop_id: selectedShop,
            stock_date: today,
            opening_stock: editingProduct.opening_stock || 0,
            closing_stock: editingProduct.closing_stock || 0,
            actual_stock: editStockValues.actual_stock,
            stock_added: editStockValues.stock_added,
            user_id: user?.id
          });

        if (insertError) throw insertError;
      }

      toast.success('Stock updated successfully');
      setEditingProduct(null);
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

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

  const getUnassignedProducts = () => {
    if (!selectedShop) return allProducts;
    
    const assignedProductIds = assignedProducts.map(p => p.id);
    return allProducts.filter(product => !assignedProductIds.includes(product.id));
  };

  const filteredAssignedProducts = assignedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Package2 className="h-5 w-5" />
            Store Product Management
            {selectedShop && assignedProducts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {assignedProducts.length} assigned products
              </Badge>
            )}
            {isAdmin && (
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                Admin
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shop-filter" className="flex items-center gap-2 text-sm font-medium">
                <Store className="h-4 w-4" />
                Select Store
              </Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a store to manage products" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                  {shops.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No stores available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search" className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4" />
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search assigned products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {!selectedShop && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Store className="h-4 w-4" />
                <span className="text-sm font-medium">Please select a store first to manage products</span>
              </div>
            </div>
          )}

          {selectedShop && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Products assigned to {shops.find(shop => shop.id === selectedShop)?.name}
              </h3>
              <Button
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign Product
              </Button>
            </div>
          )}

          {selectedShop && showAssignForm && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Assign Product with Initial Stock</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select value={selectedProductToAssign} onValueChange={setSelectedProductToAssign}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {getUnassignedProducts().map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.category}
                          </SelectItem>
                        ))}
                        {getUnassignedProducts().length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No unassigned products available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Initial stock quantity"
                      value={initialStockQuantity}
                      onChange={(e) => setInitialStockQuantity(e.target.value)}
                      className="bg-white"
                    />
                    <div className="flex gap-2">
                      <Button onClick={assignProductToShop} className="bg-green-600 hover:bg-green-700">
                        Assign
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAssignForm(false);
                          setSelectedProductToAssign("");
                          setInitialStockQuantity("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedShop && filteredAssignedProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Assigned Products for {shops.find(shop => shop.id === selectedShop)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  {filteredAssignedProducts.map((product) => {
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
                                onClick={() => handleAddStock(product.id)}
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
                              onClick={() => handleEditStock(product)}
                              className="h-8 px-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProductFromShop(product.assignment_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : selectedShop && filteredAssignedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {searchTerm ? (
              <p className="text-gray-600">No assigned products found matching "{searchTerm}"</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600">No products assigned to this store yet.</p>
                <p className="text-sm text-gray-500">Click "Assign Product" to add products to this store with initial stock.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Edit Stock Dialog */}
      <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stock for {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <div className="text-sm text-muted-foreground">Store: {shops.find(shop => shop.id === selectedShop)?.name}</div>
                <div className="text-sm text-muted-foreground">Category: {editingProduct.category}</div>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Stock Added</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={editStockValues.stock_added} 
                    onChange={(e) => setEditStockValues(prev => ({
                      ...prev,
                      stock_added: Number(e.target.value)
                    }))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Actual Stock</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={editStockValues.actual_stock} 
                    onChange={(e) => setEditStockValues(prev => ({
                      ...prev,
                      actual_stock: Number(e.target.value)
                    }))}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button onClick={handleUpdateStock} disabled={isUpdatingStock}>
              {isUpdatingStock ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductStockManagement;
