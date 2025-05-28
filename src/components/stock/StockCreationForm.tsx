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
import { Save, Plus, Store, Calendar } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface Shop {
  id: string;
  name: string;
  store_code?: string;
}

interface StockEntry {
  productId: string;
  productName: string;
  category: string;
  openingStock: number;
  stockAdded: number;
  actualStock: number;
}

interface StockCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StockCreationForm: React.FC<StockCreationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchShops = async () => {
    try {
      // Fetch HRMS stores instead of shops
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      if (error) throw error;
      
      // Transform HRMS stores to match Shop interface
      const transformedStores = data?.map(store => ({
        id: store.id,
        name: store.store_name,
        store_code: store.store_code
      })) || [];
      
      setShops(transformedStores);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const addProductToStock = (product: Product) => {
    const exists = stockEntries.find(entry => entry.productId === product.id);
    if (exists) {
      toast.error('Product already added to stock');
      return;
    }

    const newEntry: StockEntry = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      openingStock: 0,
      stockAdded: 0,
      actualStock: 0
    };

    setStockEntries(prev => [...prev, newEntry]);
    toast.success(`${product.name} added to stock`);
  };

  const updateStockEntry = (productId: string, field: keyof StockEntry, value: number) => {
    setStockEntries(prev => 
      prev.map(entry => 
        entry.productId === productId 
          ? { ...entry, [field]: Math.max(0, value) }
          : entry
      )
    );
  };

  const removeStockEntry = (productId: string) => {
    setStockEntries(prev => prev.filter(entry => entry.productId !== productId));
  };

  const saveStockEntries = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    if (stockEntries.length === 0) {
      toast.error('Please add at least one product to stock');
      return;
    }

    setLoading(true);
    try {
      const stockData = stockEntries.map(entry => ({
        stock_date: stockDate,
        product_id: entry.productId,
        shop_id: selectedShop,
        opening_stock: entry.openingStock,
        closing_stock: entry.openingStock + entry.stockAdded,
        actual_stock: entry.actualStock,
        stock_added: entry.stockAdded,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .upsert(stockData, {
          onConflict: 'stock_date,product_id,shop_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Stock entries created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving stock entries:', error);
      toast.error('Failed to save stock entries');
    } finally {
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

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Plus className="h-5 w-5" />
            Create New Stock Entry
            {stockEntries.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockEntries.length} products
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Stock Date
              </Label>
              <Input
                id="date"
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Select Store
              </Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} {shop.store_code && `(${shop.store_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={getCategoryColor(product.category)}>
                        {product.category}
                      </Badge>
                      <span className="text-sm text-gray-600">₹{product.price}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => addProductToStock(product)}
                    disabled={stockEntries.some(entry => entry.productId === product.id)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Entries ({stockEntries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stockEntries.map(entry => (
                <div key={entry.productId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.productName}</p>
                      <Badge variant="secondary" className={getCategoryColor(entry.category)}>
                        {entry.category}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => removeStockEntry(entry.productId)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Opening Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={entry.openingStock}
                        onChange={(e) => updateStockEntry(entry.productId, 'openingStock', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Stock Added</Label>
                      <Input
                        type="number"
                        min="0"
                        value={entry.stockAdded}
                        onChange={(e) => updateStockEntry(entry.productId, 'stockAdded', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Actual Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        value={entry.actualStock}
                        onChange={(e) => updateStockEntry(entry.productId, 'actualStock', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {stockEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No products added to stock yet.</p>
                  <p className="text-sm">Add products from the left panel.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={saveStockEntries}
          disabled={loading || !selectedShop || stockEntries.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Create Stock Entries'}
        </Button>
      </div>
    </div>
  );
};

export default StockCreationForm;
