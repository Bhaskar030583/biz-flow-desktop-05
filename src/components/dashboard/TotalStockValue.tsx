
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  IndianRupee, 
  Package, 
  TrendingUp,
  RefreshCw,
  BarChart3
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StockValue {
  shop_name: string;
  shop_id: string;
  category: string;
  product_name: string;
  current_stock: number;
  price: number;
  value: number;
}

interface StockSummary {
  totalValue: number;
  totalProducts: number;
  byCategory: Record<string, { value: number; products: number }>;
  byShop: Record<string, { value: number; products: number }>;
}

export const TotalStockValue: React.FC = () => {
  const [stockSummary, setStockSummary] = useState<StockSummary>({
    totalValue: 0,
    totalProducts: 0,
    byCategory: {},
    byShop: {}
  });
  const [stockDetails, setStockDetails] = useState<StockValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStockValue = async () => {
    try {
      setLoading(true);
      
      // Get the latest stock entries with product prices
      const { data: stockData, error } = await supabase
        .from("stocks")
        .select(`
          product_id,
          shop_id,
          actual_stock,
          stock_date,
          products!inner (
            id,
            name,
            category,
            price
          ),
          shops!inner (
            id,
            name
          )
        `)
        .gt('actual_stock', 0)
        .order('stock_date', { ascending: false });

      if (error) throw error;

      // Group by product-shop combination and get the latest entry
      const latestStocks = new Map();
      
      stockData?.forEach(stock => {
        const key = `${stock.product_id}-${stock.shop_id}`;
        if (!latestStocks.has(key) || 
            new Date(stock.stock_date) > new Date(latestStocks.get(key).stock_date)) {
          latestStocks.set(key, stock);
        }
      });

      // Calculate stock values
      const stockValues: StockValue[] = Array.from(latestStocks.values())
        .filter(stock => stock.actual_stock > 0)
        .map(stock => ({
          shop_name: stock.shops.name,
          shop_id: stock.shops.id,
          category: stock.products.category || "Uncategorized",
          product_name: stock.products.name,
          current_stock: stock.actual_stock,
          price: Number(stock.products.price) || 0,
          value: stock.actual_stock * (Number(stock.products.price) || 0)
        }));

      // Calculate summary
      const summary: StockSummary = {
        totalValue: stockValues.reduce((sum, item) => sum + item.value, 0),
        totalProducts: stockValues.length,
        byCategory: {},
        byShop: {}
      };

      // Group by category
      stockValues.forEach(item => {
        if (!summary.byCategory[item.category]) {
          summary.byCategory[item.category] = { value: 0, products: 0 };
        }
        summary.byCategory[item.category].value += item.value;
        summary.byCategory[item.category].products += 1;
      });

      // Group by shop
      stockValues.forEach(item => {
        if (!summary.byShop[item.shop_name]) {
          summary.byShop[item.shop_name] = { value: 0, products: 0 };
        }
        summary.byShop[item.shop_name].value += item.value;
        summary.byShop[item.shop_name].products += 1;
      });

      setStockSummary(summary);
      setStockDetails(stockValues.sort((a, b) => b.value - a.value));
    } catch (error) {
      console.error("Error fetching stock value:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockValue();
  }, []);

  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Stock Value</p>
                <div className="text-base font-bold text-green-600 truncate">
                  {formatIndianRupee(stockSummary.totalValue)}
                </div>
                <div className="mt-1 text-xs text-blue-600 flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  <span>{stockSummary.totalProducts} products</span>
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-full ml-2">
                <IndianRupee className="h-3 w-3 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              Stock Value Breakdown
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStockValue}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    By Category
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stockSummary.byCategory)
                      .sort(([,a], [,b]) => b.value - a.value)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category}
                            </Badge>
                            <span className="text-gray-500">({data.products})</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatIndianRupee(data.value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    By Shop
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stockSummary.byShop)
                      .sort(([,a], [,b]) => b.value - a.value)
                      .map(([shop, data]) => (
                        <div key={shop} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {shop}
                            </Badge>
                            <span className="text-gray-500">({data.products})</span>
                          </div>
                          <span className="font-semibold text-blue-600">
                            {formatIndianRupee(data.value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Product List */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Product Details</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stockDetails.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.product_name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <span>•</span>
                          <span>{item.shop_name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatIndianRupee(item.value)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.current_stock} × {formatIndianRupee(item.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
