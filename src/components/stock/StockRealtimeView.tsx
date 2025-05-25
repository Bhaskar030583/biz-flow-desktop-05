
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Package, Search, Store, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StockViewItem {
  productId: string;
  productName: string;
  category: string;
  shopId: string;
  shopName: string;
  currentStock: number;
  lastUpdated: string;
  stockStatus: 'healthy' | 'low' | 'out';
}

interface Shop {
  id: string;
  name: string;
}

const StockRealtimeView: React.FC = () => {
  const { user } = useAuth();
  const [stockData, setStockData] = useState<StockViewItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchShops();
      fetchStockData();
    }
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel('stocks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stocks'
        },
        () => {
          fetchStockData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    }
  };

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('stocks')
        .select(`
          product_id,
          shop_id,
          actual_stock,
          stock_date,
          products (id, name, category),
          shops (id, name)
        `)
        .eq('user_id', user?.id)
        .eq('stock_date', today)
        .order('products(name)');

      if (error) throw error;

      const stockItems: StockViewItem[] = (data || []).map(item => {
        const stock = item.actual_stock || 0;
        let stockStatus: 'healthy' | 'low' | 'out' = 'healthy';
        
        if (stock === 0) {
          stockStatus = 'out';
        } else if (stock <= 5) {
          stockStatus = 'low';
        }

        return {
          productId: item.product_id,
          productName: item.products?.name || 'Unknown Product',
          category: item.products?.category || 'Uncategorized',
          shopId: item.shop_id,
          shopName: item.shops?.name || 'Unknown Shop',
          currentStock: stock,
          lastUpdated: item.stock_date,
          stockStatus
        };
      });

      setStockData(stockItems);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(stockItems.map(item => item.category)));
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <TrendingUp className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      case 'out':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Filter data based on search term, shop, and category
  const filteredData = stockData.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShop = selectedShop === "all" || item.shopId === selectedShop;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesShop && matchesCategory;
  });

  // Group by category for better organization
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StockViewItem[]>);

  const totalProducts = filteredData.length;
  const outOfStock = filteredData.filter(item => item.stockStatus === 'out').length;
  const lowStock = filteredData.filter(item => item.stockStatus === 'low').length;
  const healthyStock = filteredData.filter(item => item.stockStatus === 'healthy').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Healthy Stock</p>
                <p className="text-2xl font-bold text-green-600">{healthyStock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
            <div>
              <Label htmlFor="search">Search Products</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="shop">Filter by Shop</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="All Shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Filter by Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchStockData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Data by Category */}
      <div className="space-y-6">
        {Object.keys(groupedData).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Data Found</h3>
              <p className="text-gray-500">
                No stock entries found for today. Please add stock data to see real-time inventory levels.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedData).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {category}
                  <Badge variant="secondary">{items.length} products</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {items.map(item => (
                    <div
                      key={`${item.productId}-${item.shopId}`}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Store className="h-3 w-3" />
                            {item.shopName}
                          </div>
                        </div>
                        <Badge className={`${getStockStatusColor(item.stockStatus)} flex items-center gap-1`}>
                          {getStockIcon(item.stockStatus)}
                          {item.stockStatus}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <span className="font-semibold text-lg">{item.currentStock}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Last Updated:</span>
                          <span className="text-sm">{format(new Date(item.lastUpdated), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StockRealtimeView;
