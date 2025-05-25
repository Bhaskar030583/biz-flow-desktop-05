
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Package, 
  TrendingDown,
  X,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LowStockProduct {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  shop_name: string;
  shop_id: string;
  last_updated: string;
}

interface LowStockAlertProps {
  threshold?: number;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ 
  threshold = 10 
}) => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      
      // Get the latest stock entries for each product-shop combination
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
            category
          ),
          shops!inner (
            id,
            name
          )
        `)
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

      // Filter products with low stock
      const lowStock: LowStockProduct[] = Array.from(latestStocks.values())
        .filter(stock => stock.actual_stock <= threshold)
        .map(stock => ({
          id: stock.products.id,
          name: stock.products.name,
          category: stock.products.category,
          current_stock: stock.actual_stock,
          shop_name: stock.shops.name,
          shop_id: stock.shops.id,
          last_updated: stock.stock_date
        }))
        .sort((a, b) => a.current_stock - b.current_stock);

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, [threshold]);

  const groupedByCategory = lowStockProducts.reduce((groups, product) => {
    const category = product.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {} as Record<string, LowStockProduct[]>);

  const getStockLevelColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-700 border-red-200";
    if (stock <= 5) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getStockLevelIcon = (stock: number) => {
    if (stock === 0) return <AlertTriangle className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`relative ${
            lowStockProducts.length > 0 
              ? 'border-red-200 text-red-600 hover:bg-red-50' 
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
        >
          <Package className="h-4 w-4 mr-2" />
          Low Stock
          {lowStockProducts.length > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs"
            >
              {lowStockProducts.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alert
              <Badge variant="outline" className="ml-2">
                {lowStockProducts.length} items
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLowStockProducts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-green-600 font-medium">All products are well stocked!</p>
              <p className="text-sm text-gray-500 mt-1">
                No products below {threshold} units found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByCategory).map(([category, products]) => (
                <Card key={category} className="border-l-4 border-l-red-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant="outline" className="border-red-200 text-red-700">
                        {category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({products.length} items)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {products.map((product, index) => (
                        <div key={`${product.id}-${product.shop_id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getStockLevelColor(product.current_stock)}`}>
                                  {getStockLevelIcon(product.current_stock)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {product.shop_name}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      Updated: {new Date(product.last_updated).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStockLevelColor(product.current_stock)}`}>
                                {product.current_stock} units
                              </div>
                              {product.current_stock === 0 && (
                                <div className="text-xs text-red-600 mt-1 font-medium">
                                  Out of Stock
                                </div>
                              )}
                            </div>
                          </div>
                          {index < products.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
