import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package2, Store, Calendar, Save, RefreshCw } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface Shop {
  id: string;
  name: string;
}

interface StockData {
  productId: string;
  productName: string;
  category: string;
  openingStock: number;
  stockAdded: number;
  closingStock: number;
  actual: number;
  totalSales: number;
}

interface BillItem {
  product_id: string;
  quantity: number;
  bills: {
    bill_date: string;
    user_id: string;
  };
}

interface ProductStockManagementProps {
  onStockUpdated: () => void;
}

const ProductStockManagement = ({ onStockUpdated }: ProductStockManagementProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop && products.length > 0) {
      loadStockData();
    }
  }, [selectedShop, stockDate, products]);

  // Listen for real-time changes to bills to auto-update closing stock
  useEffect(() => {
    if (!selectedShop || !stockDate) return;

    const channel = supabase
      .channel('bills-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills'
        },
        (payload) => {
          console.log('Bill change detected:', payload);
          // Reload stock data when bills change
          const billDate = payload.new?.bill_date;
          if (billDate && billDate.startsWith(stockDate)) {
            loadStockData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bill_items'
        },
        (payload) => {
          console.log('Bill item change detected:', payload);
          // Reload stock data when bill items change
          loadStockData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedShop, stockDate]);

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

  const loadStockData = async () => {
    if (!selectedShop) return;
    
    try {
      // Fetch existing stock data
      const { data: existingStock, error: stockError } = await supabase
        .from('stocks')
        .select(`
          product_id,
          opening_stock,
          stock_added,
          closing_stock,
          actual_stock
        `)
        .eq('shop_id', selectedShop)
        .eq('stock_date', stockDate);

      if (stockError) throw stockError;

      // Fetch sales data for the selected date to calculate total sales
      const { data: salesData, error: salesError } = await supabase
        .from('bill_items')
        .select(`
          product_id,
          quantity,
          bills!inner(
            bill_date,
            user_id
          )
        `)
        .eq('bills.user_id', user?.id)
        .gte('bills.bill_date', `${stockDate}T00:00:00.000Z`)
        .lt('bills.bill_date', `${stockDate}T23:59:59.999Z`) as { data: BillItem[] | null; error: any };

      if (salesError) throw salesError;

      // Calculate total sales per product
      const salesByProduct = salesData?.reduce((acc, sale) => {
        const productId = sale.product_id;
        acc[productId] = (acc[productId] || 0) + sale.quantity;
        return acc;
      }, {} as Record<string, number>) || {};

      const newStockData: StockData[] = products.map(product => {
        const existing = existingStock?.find(stock => stock.product_id === product.id);
        const totalSales = salesByProduct[product.id] || 0;
        const openingStock = existing?.opening_stock || 0;
        const stockAdded = existing?.stock_added || 0;
        
        // Auto-calculate closing stock: opening + added - sales
        const closingStock = openingStock + stockAdded - totalSales;
        
        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          openingStock,
          stockAdded,
          closingStock: Math.max(0, closingStock), // Ensure non-negative
          actual: existing?.actual_stock || 0,
          totalSales,
        };
      });

      setStockData(newStockData);
    } catch (error) {
      console.error('Error loading stock data:', error);
      toast.error('Failed to load stock data');
    }
  };

  const updateStockValue = (productId: string, field: keyof StockData, value: string) => {
    const numValue = parseInt(value) || 0;
    
    setStockData(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const updated = { ...item, [field]: Math.max(0, numValue) };
          
          // Auto-calculate closing stock when opening stock or stock added changes
          if (field === 'openingStock' || field === 'stockAdded') {
            updated.closingStock = Math.max(0, updated.openingStock + updated.stockAdded - updated.totalSales);
          }
          
          return updated;
        }
        return item;
      })
    );
  };

  const saveStockData = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    setLoading(true);
    try {
      const stockEntries = stockData.map(item => ({
        stock_date: stockDate,
        product_id: item.productId,
        shop_id: selectedShop,
        opening_stock: item.openingStock,
        stock_added: item.stockAdded,
        closing_stock: item.closingStock,
        actual_stock: item.actual,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .upsert(stockEntries, {
          onConflict: 'stock_date,product_id,shop_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Stock data saved successfully');
      onStockUpdated();
    } catch (error) {
      console.error('Error saving stock data:', error);
      toast.error('Failed to save stock data');
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
    <div className="space-y-4">
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Package2 className="h-5 w-5" />
            Stock Management
            {stockData.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockData.length} products
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Select Shop
              </Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadStockData}
                disabled={!selectedShop}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={saveStockData}
                disabled={loading || !selectedShop || stockData.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Stock Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedShop && stockData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Stock Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Opening Stock</TableHead>
                    <TableHead>Stock Added</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Closing Stock</TableHead>
                    <TableHead>Actual Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockData.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.openingStock}
                          onChange={(e) => updateStockValue(item.productId, 'openingStock', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.stockAdded}
                          onChange={(e) => updateStockValue(item.productId, 'stockAdded', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-red-600">
                          {item.totalSales}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                          {item.closingStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.actual}
                          onChange={(e) => updateStockValue(item.productId, 'actual', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedShop && products.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No products found. Please add products first.</p>
          </CardContent>
        </Card>
      )}

      {!selectedShop && (
        <Card>
          <CardContent className="py-8 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Please select a shop to manage stock.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductStockManagement;
