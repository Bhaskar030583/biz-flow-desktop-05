
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
  cost_price: number;
  value: number;
  sold_units: number;
  sold_value: number;
  added_units: number;
  added_value: number;
  pos_sold_units: number;
  pos_sold_value: number;
}

interface StockSummary {
  totalCurrentValue: number;
  totalSoldValue: number;
  totalAddedValue: number;
  totalPOSSoldValue: number;
  totalValue: number;
  totalProducts: number;
  byCategory: Record<string, { 
    currentValue: number; 
    soldValue: number; 
    addedValue: number; 
    posSoldValue: number;
    totalValue: number; 
    products: number; 
  }>;
  byShop: Record<string, { 
    currentValue: number; 
    soldValue: number; 
    addedValue: number; 
    posSoldValue: number;
    totalValue: number; 
    products: number; 
  }>;
}

export const TotalStockValue: React.FC = () => {
  const [stockSummary, setStockSummary] = useState<StockSummary>({
    totalCurrentValue: 0,
    totalSoldValue: 0,
    totalAddedValue: 0,
    totalPOSSoldValue: 0,
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
      
      // Get the latest stock entries with product cost prices
      const { data: stockData, error } = await supabase
        .from("stocks")
        .select(`
          product_id,
          shop_id,
          opening_stock,
          closing_stock,
          actual_stock,
          stock_added,
          stock_date,
          products!inner (
            id,
            name,
            category,
            cost_price
          ),
          shops!inner (
            id,
            name
          )
        `)
        .order('stock_date', { ascending: false });

      if (error) throw error;

      // Get POS sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          product_id,
          shop_id,
          quantity,
          products!inner (
            id,
            name,
            category,
            cost_price
          ),
          shops!inner (
            id,
            name
          )
        `);

      if (salesError) throw salesError;

      // Group by product-shop combination and get the latest entry
      const latestStocks = new Map();
      
      stockData?.forEach(stock => {
        const key = `${stock.product_id}-${stock.shop_id}`;
        if (!latestStocks.has(key) || 
            new Date(stock.stock_date) > new Date(latestStocks.get(key).stock_date)) {
          latestStocks.set(key, stock);
        }
      });

      // Calculate POS sales by product-shop combination
      const posSales = new Map();
      salesData?.forEach(sale => {
        const key = `${sale.product_id}-${sale.shop_id}`;
        if (posSales.has(key)) {
          posSales.set(key, posSales.get(key) + sale.quantity);
        } else {
          posSales.set(key, sale.quantity);
        }
      });

      // Calculate stock values based on cost price
      const stockValues: StockValue[] = Array.from(latestStocks.values())
        .map(stock => {
          const costPrice = Number(stock.products.cost_price) || 0;
          const currentStock = stock.actual_stock || 0;
          const soldUnits = Math.max(0, stock.opening_stock - stock.closing_stock);
          const addedUnits = stock.stock_added || 0;
          
          // Get POS sales for this product-shop combination
          const key = `${stock.product_id}-${stock.shop_id}`;
          const posSoldUnits = posSales.get(key) || 0;
          
          return {
            shop_name: stock.shops.name,
            shop_id: stock.shops.id,
            category: stock.products.category || "Uncategorized",
            product_name: stock.products.name,
            current_stock: currentStock,
            cost_price: costPrice,
            value: currentStock * costPrice,
            sold_units: soldUnits,
            sold_value: soldUnits * costPrice,
            added_units: addedUnits,
            added_value: addedUnits * costPrice,
            pos_sold_units: posSoldUnits,
            pos_sold_value: posSoldUnits * costPrice
          };
        });

      // Calculate summary
      const summary: StockSummary = {
        totalCurrentValue: stockValues.reduce((sum, item) => sum + item.value, 0),
        totalSoldValue: stockValues.reduce((sum, item) => sum + item.sold_value, 0),
        totalAddedValue: stockValues.reduce((sum, item) => sum + item.added_value, 0),
        totalPOSSoldValue: stockValues.reduce((sum, item) => sum + item.pos_sold_value, 0),
        totalValue: 0,
        totalProducts: stockValues.length,
        byCategory: {},
        byShop: {}
      };

      // Calculate total value (current + sold + added - POS sold)
      summary.totalValue = summary.totalCurrentValue + summary.totalSoldValue + summary.totalAddedValue;

      // Group by category
      stockValues.forEach(item => {
        if (!summary.byCategory[item.category]) {
          summary.byCategory[item.category] = { 
            currentValue: 0, 
            soldValue: 0, 
            addedValue: 0, 
            posSoldValue: 0,
            totalValue: 0, 
            products: 0 
          };
        }
        summary.byCategory[item.category].currentValue += item.value;
        summary.byCategory[item.category].soldValue += item.sold_value;
        summary.byCategory[item.category].addedValue += item.added_value;
        summary.byCategory[item.category].posSoldValue += item.pos_sold_value;
        summary.byCategory[item.category].totalValue += (item.value + item.sold_value + item.added_value);
        summary.byCategory[item.category].products += 1;
      });

      // Group by shop
      stockValues.forEach(item => {
        if (!summary.byShop[item.shop_name]) {
          summary.byShop[item.shop_name] = { 
            currentValue: 0, 
            soldValue: 0, 
            addedValue: 0, 
            posSoldValue: 0,
            totalValue: 0, 
            products: 0 
          };
        }
        summary.byShop[item.shop_name].currentValue += item.value;
        summary.byShop[item.shop_name].soldValue += item.sold_value;
        summary.byShop[item.shop_name].addedValue += item.added_value;
        summary.byShop[item.shop_name].posSoldValue += item.pos_sold_value;
        summary.byShop[item.shop_name].totalValue += (item.value + item.sold_value + item.added_value);
        summary.byShop[item.shop_name].products += 1;
      });

      setStockSummary(summary);
      setStockDetails(stockValues.sort((a, b) => (b.value + b.sold_value + b.added_value) - (a.value + a.sold_value + a.added_value)));
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
                <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Stock Value (Cost Price)</p>
                <div className="text-base font-bold text-green-600 truncate">
                  {formatIndianRupee(stockSummary.totalValue)}
                </div>
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-2">
                  <div className="flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    <span>{stockSummary.totalProducts} products</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                  <span>Current: {formatIndianRupee(stockSummary.totalCurrentValue)}</span>
                  <span>Sold: {formatIndianRupee(stockSummary.totalSoldValue)}</span>
                  <span>Added: {formatIndianRupee(stockSummary.totalAddedValue)}</span>
                  <span>POS Sold: {formatIndianRupee(stockSummary.totalPOSSoldValue)}</span>
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
              Stock Value Breakdown (Cost Price Based)
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
            {/* Summary Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-blue-700 mb-2">Current Stock</h3>
                  <div className="text-xl font-bold text-blue-600">
                    {formatIndianRupee(stockSummary.totalCurrentValue)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-orange-700 mb-2">Sold Stock</h3>
                  <div className="text-xl font-bold text-orange-600">
                    {formatIndianRupee(stockSummary.totalSoldValue)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-purple-700 mb-2">Added Stock</h3>
                  <div className="text-xl font-bold text-purple-600">
                    {formatIndianRupee(stockSummary.totalAddedValue)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-red-700 mb-2">POS Sold</h3>
                  <div className="text-xl font-bold text-red-600">
                    {formatIndianRupee(stockSummary.totalPOSSoldValue)}
                  </div>
                </CardContent>
              </Card>
            </div>

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
                      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
                      .map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category}
                            </Badge>
                            <span className="text-gray-500">({data.products})</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatIndianRupee(data.totalValue)}
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
                      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
                      .map(([shop, data]) => (
                        <div key={shop} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {shop}
                            </Badge>
                            <span className="text-gray-500">({data.products})</span>
                          </div>
                          <span className="font-semibold text-blue-600">
                            {formatIndianRupee(data.totalValue)}
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
                        <div className="text-xs text-gray-600 mt-1">
                          Current: {item.current_stock} | Sold: {item.sold_units} | Added: {item.added_units} | POS Sold: {item.pos_sold_units}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatIndianRupee(item.value + item.sold_value + item.added_value)}
                        </div>
                        <div className="text-xs text-gray-500">
                          @ {formatIndianRupee(item.cost_price)} cost price
                        </div>
                        <div className="text-xs text-gray-400">
                          C: {formatIndianRupee(item.value)} | S: {formatIndianRupee(item.sold_value)} | A: {formatIndianRupee(item.added_value)} | P: {formatIndianRupee(item.pos_sold_value)}
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
