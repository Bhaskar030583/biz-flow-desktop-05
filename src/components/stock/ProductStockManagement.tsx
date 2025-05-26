
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package2, Search, Store, Plus, X } from "lucide-react";

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

  console.log("ProductStockManagement component loaded - showing products list with store filter and assignment functionality");

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      fetchAssignedProducts();
    }
  }, [selectedShop]);

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
      
      const { data, error } = await supabase
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
      
      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        assignment_id: item.id,
        id: item.products.id,
        name: item.products.name,
        category: item.products.category,
        price: item.products.price,
        cost_price: item.products.cost_price
      })) || [];
      
      console.log("Fetched assigned products:", formattedData.length, "products");
      setAssignedProducts(formattedData);
    } catch (error) {
      console.error('Error fetching assigned products:', error);
      toast.error('Failed to fetch assigned products');
    }
  };

  const assignProductToShop = async () => {
    if (!selectedProductToAssign || !selectedShop) {
      toast.error('Please select both a product and a shop');
      return;
    }

    try {
      console.log("Assigning product to shop:", selectedProductToAssign, selectedShop);
      
      const { error } = await supabase
        .from('product_shops')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          user_id: user?.id
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.error('Product is already assigned to this shop');
        } else {
          throw error;
        }
        return;
      }
      
      toast.success('Product assigned to shop successfully');
      setSelectedProductToAssign("");
      setShowAssignForm(false);
      fetchAssignedProducts();
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
                  <Label className="text-sm font-medium">Select Product to Assign</Label>
                  <div className="flex gap-2">
                    <Select value={selectedProductToAssign} onValueChange={setSelectedProductToAssign}>
                      <SelectTrigger className="bg-white flex-1">
                        <SelectValue placeholder="Choose a product to assign" />
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
                    <Button onClick={assignProductToShop} className="bg-green-600 hover:bg-green-700">
                      Assign
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAssignForm(false);
                        setSelectedProductToAssign("");
                      }}
                    >
                      Cancel
                    </Button>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignedProducts.map((product) => (
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
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProductFromShop(product.assignment_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                <p className="text-sm text-gray-500">Click "Assign Product" to add products to this store.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ProductStockManagement;
