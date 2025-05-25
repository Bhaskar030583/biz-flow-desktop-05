
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
import { Save, RefreshCw, Plus, Trash2, Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDataSyncActions } from "@/hooks/useDataSyncActions";

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

interface StockEntry {
  id: string;
  product_id: string;
  product_name: string;
  shop_id: string;
  opening_stock: number;
  actual_stock: number;
  closing_stock: number;
  stock_added: number;
  price: number;
  category: string;
}

interface BatchStockEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockEntry: React.FC<BatchStockEntryProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { syncAfterStockChange } = useDataSyncActions();
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

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
        .select('id, name, price, category')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const addProductToEntry = (product: Product) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    const exists = stockEntries.find(entry => entry.product_id === product.id);
    if (exists) {
      toast.error('Product already added to batch');
      return;
    }

    const newEntry: StockEntry = {
      id: `temp-${Date.now()}-${product.id}`,
      product_id: product.id,
      product_name: product.name,
      shop_id: selectedShop,
      opening_stock: 0,
      actual_stock: 0,
      closing_stock: 0,
      stock_added: 0,
      price: product.price,
      category: product.category
    };

    setStockEntries(prev => [...prev, newEntry]);
  };

  const updateEntry = (id: string, field: keyof StockEntry, value: number) => {
    setStockEntries(prev => 
      prev.map(entry => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };
          // Auto-calculate closing stock when opening stock or stock added changes
          if (field === 'opening_stock' || field === 'stock_added') {
            updated.closing_stock = updated.opening_stock + updated.stock_added;
          }
          return updated;
        }
        return entry;
      })
    );
  };

  const removeEntry = (id: string) => {
    setStockEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    if (stockEntries.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      const stockData = stockEntries.map(entry => ({
        stock_date: stockDate,
        product_id: entry.product_id,
        shop_id: selectedShop,
        opening_stock: entry.opening_stock,
        actual_stock: entry.actual_stock,
        closing_stock: entry.closing_stock,
        stock_added: entry.stock_added || 0,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .insert(stockData);

      if (error) throw error;

      await syncAfterStockChange('create', { count: stockEntries.length });
      onSuccess();
    } catch (error) {
      console.error('Error saving stock entries:', error);
      toast.error('Failed to save stock entries');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Please log in to access batch stock entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Package className="h-5 w-5" />
            Batch Stock Entry
            {stockEntries.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockEntries.length} items
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
              <Label htmlFor="shop">Shop</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
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
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => addProductToEntry(product)}
                  disabled={stockEntries.some(entry => entry.product_id === product.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </div>
                  <Badge variant="secondary">₹{product.price}</Badge>
                </Button>
              ))}
              {products.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No products available
                </div>
              )}
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
                <div key={entry.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{entry.product_name}</div>
                      <div className="text-sm text-gray-500">{entry.category}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`opening-${entry.id}`} className="text-xs">Opening</Label>
                      <Input
                        id={`opening-${entry.id}`}
                        type="number"
                        value={entry.opening_stock}
                        onChange={(e) => updateEntry(entry.id, 'opening_stock', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`added-${entry.id}`} className="text-xs">Added</Label>
                      <Input
                        id={`added-${entry.id}`}
                        type="number"
                        value={entry.stock_added}
                        onChange={(e) => updateEntry(entry.id, 'stock_added', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`actual-${entry.id}`} className="text-xs">Actual</Label>
                      <Input
                        id={`actual-${entry.id}`}
                        type="number"
                        value={entry.actual_stock}
                        onChange={(e) => updateEntry(entry.id, 'actual_stock', parseInt(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Closing</Label>
                      <Input
                        value={entry.closing_stock}
                        disabled
                        className="h-8 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || stockEntries.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save {stockEntries.length} Entries
        </Button>
      </div>
    </div>
  );
};

export default BatchStockEntry;
