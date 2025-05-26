
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package2, Search, Store } from "lucide-react";

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

interface ProductStockManagementProps {
  onStockUpdated: () => void;
}

const ProductStockManagement = ({ onStockUpdated }: ProductStockManagementProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  console.log("ProductStockManagement component loaded - showing products list with store filter");

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      console.log("Fetching products for user:", user?.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      
      console.log("Fetched products:", data?.length || 0, "products");
      setProducts(data || []);
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

  const filteredProducts = products.filter(product =>
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
            Products List
            {products.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {products.length} products
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
                  <SelectValue placeholder="Select a store to add products" />
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
                  placeholder="Search products..."
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
        </CardContent>
      </Card>

      {selectedShop && filteredProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Products for {shops.find(shop => shop.id === selectedShop)?.name}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : selectedShop && filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {searchTerm ? (
              <p className="text-gray-600">No products found matching "{searchTerm}"</p>
            ) : (
              <p className="text-gray-600">No products found. Please add products first.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default ProductStockManagement;
