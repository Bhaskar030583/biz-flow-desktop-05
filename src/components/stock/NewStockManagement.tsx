
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Save, RefreshCw, Plus, Package2, Store } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Shop {
  id: string;
  name: string;
}

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  actualStock: number;
  availableStock: number;
}

interface NewStockManagementProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NewStockManagement: React.FC<NewStockManagementProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchShops();
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      loadStoreInventory();
    }
  }, [selectedShop]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      setProducts(data || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const loadStoreInventory = async () => {
    if (!selectedShop) return;
    
    try {
      // Get current stock for this shop
      const { data: stockData, error } = await supabase
        .from('stocks')
        .select(`
          product_id,
          actual_stock,
          closing_stock,
          products (id, name, category)
        `)
        .eq('shop_id', selectedShop)
        .eq('stock_date', stockDate);

      if (error) throw error;

      // Create stock items for all products in the store
      const storeProducts = products.filter(product => 
        stockData?.some(stock => stock.product_id === product.id) || 
        stockData?.length === 0 // If no stock data, show all products
      );

      const newStockItems: StockItem[] = products.map(product => {
        const existingStock = stockData?.find(stock => stock.product_id === product.id);
        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          actualStock: existingStock?.actual_stock || 0,
          availableStock: existingStock?.closing_stock || 0,
        };
      });

      setStockItems(newStockItems);
    } catch (error) {
      console.error('Error loading store inventory:', error);
      toast.error('Failed to load store inventory');
    }
  };

  const addProductToStore = (product: Product) => {
    const exists = stockItems.find(item => item.productId === product.id);
    if (exists) {
      toast.error('Product already in store inventory');
      return;
    }

    const newItem: StockItem = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      actualStock: 0,
      availableStock: 0,
    };

    setStockItems(prev => [...prev, newItem]);
    toast.success(`${product.name} added to store inventory`);
  };

  const updateStockItem = (productId: string, field: 'actualStock' | 'availableStock', value: number) => {
    setStockItems(prev => 
      prev.map(item => 
        item.productId === productId 
          ? { ...item, [field]: Math.max(0, value) }
          : item
      )
    );
  };

  const saveStockData = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    if (stockItems.length === 0) {
      toast.error('No products in store inventory');
      return;
    }

    setLoading(true);
    try {
      // Prepare stock data for upsert
      const stockData = stockItems.map(item => ({
        stock_date: stockDate,
        product_id: item.productId,
        shop_id: selectedShop,
        opening_stock: item.availableStock,
        closing_stock: item.availableStock,
        actual_stock: item.actualStock,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .upsert(stockData, {
          onConflict: 'stock_date,product_id,shop_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Store inventory updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving stock data:', error);
      toast.error('Failed to save store inventory');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Please log in to access store management.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedProducts = categories.reduce((acc, category) => {
    acc[category] = products.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Store className="h-5 w-5" />
            Store Management
            {stockItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockItems.length} products
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <div>
              <Label htmlFor="date">Stock Date</Label>
              <Input
                id="date"
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="shop">Select Store</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                  {shops.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No shops available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadStoreInventory}
                disabled={!selectedShop}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Inventory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedShop && (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Products by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {categories.map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="grid gap-2">
                      {groupedProducts[category]?.map(product => (
                        <Button
                          key={product.id}
                          variant="outline"
                          className="justify-between h-auto p-3"
                          onClick={() => addProductToStore(product)}
                          disabled={stockItems.some(item => item.productId === product.id)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{product.name}</div>
                          </div>
                          <Badge variant="secondary">₹{product.price}</Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No products available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-4 w-4" />
                Store Inventory ({stockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {stockItems.map(item => (
                  <div key={item.productId} className="p-3 border rounded-lg">
                    <div className="mb-2">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`actual-${item.productId}`} className="text-xs">Actual Stock</Label>
                        <Input
                          id={`actual-${item.productId}`}
                          type="number"
                          value={item.actualStock}
                          onChange={(e) => updateStockItem(item.productId, 'actualStock', parseInt(e.target.value) || 0)}
                          className="h-8"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`available-${item.productId}`} className="text-xs">Available Stock</Label>
                        <Input
                          id={`available-${item.productId}`}
                          type="number"
                          value={item.availableStock}
                          onChange={(e) => updateStockItem(item.productId, 'availableStock', parseInt(e.target.value) || 0)}
                          className="h-8"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {stockItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products in store inventory</p>
                    <p className="text-sm">Add products from the left panel</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={saveStockData}
          disabled={loading || !selectedShop || stockItems.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Store Inventory
        </Button>
      </div>
    </div>
  );
};

export default NewStockManagement;
