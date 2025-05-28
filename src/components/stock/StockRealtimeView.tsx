
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeftRight, AlertTriangle, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface StockRealtimeViewProps {
  selectedShop?: string;
}

const StockRealtimeView: React.FC<StockRealtimeViewProps> = ({ selectedShop }) => {
  const { user } = useAuth();
  const [stockLastUpdated, setStockLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real-time stock status query
  const { data: stockStatus, refetch: refetchStock } = useQuery({
    queryKey: ['stock-status', selectedShop, stockLastUpdated],
    queryFn: async () => {
      if (!selectedShop) return null;
      
      // Get the latest stock entries for the shop
      const { data: stockEntries, error: stockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id)
        .order('stock_date', { ascending: false });

      if (stockError) throw stockError;

      // Get latest stock for each product
      const latestStocksMap = new Map();
      stockEntries?.forEach(entry => {
        if (!latestStocksMap.has(entry.product_id) || 
            new Date(entry.stock_date) > new Date(latestStocksMap.get(entry.product_id).stock_date)) {
          latestStocksMap.set(entry.product_id, entry);
        }
      });

      // Get product details
      const productIds = Array.from(latestStocksMap.keys());
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .in('id', productIds);

      if (prodError) throw prodError;

      // Get low stock alerts
      const { data: lowStockAlerts, error: alertError } = await supabase
        .from('low_stock_alerts')
        .select('product_id, current_stock, minimum_threshold')
        .eq('shop_id', selectedShop)
        .eq('is_resolved', false);

      if (alertError) throw alertError;

      // Create alerts map
      const alertsMap = new Map();
      lowStockAlerts?.forEach(alert => {
        alertsMap.set(alert.product_id, {
          current: alert.current_stock,
          threshold: alert.minimum_threshold
        });
      });

      // Get reorder points
      const { data: reorderPoints, error: rpError } = await supabase
        .from('reorder_points')
        .select('product_id, minimum_stock')
        .eq('shop_id', selectedShop);

      if (rpError) throw rpError;

      // Create reorder points map
      const reorderMap = new Map();
      reorderPoints?.forEach(rp => {
        reorderMap.set(rp.product_id, rp.minimum_stock);
      });

      // Combine data
      const combined = products?.map(product => {
        const stockEntry = latestStocksMap.get(product.id);
        const alert = alertsMap.get(product.id);
        const reorderPoint = reorderMap.get(product.id) || 10; // Default
        
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost_price: product.cost_price,
          currentStock: stockEntry?.actual_stock || 0,
          lastUpdated: stockEntry?.stock_date || null,
          hasAlert: !!alert,
          reorderPoint,
          status: getStockStatus(stockEntry?.actual_stock || 0, reorderPoint)
        };
      }) || [];

      // Sort by status (critical first) then by name
      return combined.sort((a, b) => {
        if (a.status.priority !== b.status.priority) {
          return a.status.priority - b.status.priority;
        }
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!selectedShop && !!user?.id
  });

  // Helper function to determine stock status
  const getStockStatus = (currentStock: number, reorderPoint: number) => {
    if (currentStock === 0) {
      return { text: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200", priority: 1 };
    }
    if (currentStock <= reorderPoint * 0.5) {
      return { text: "Critical", color: "bg-orange-100 text-orange-800 border-orange-200", priority: 2 };
    }
    if (currentStock <= reorderPoint) {
      return { text: "Low", color: "bg-yellow-100 text-yellow-700 border-yellow-200", priority: 3 };
    }
    return { text: "Good", color: "bg-green-100 text-green-800 border-green-200", priority: 4 };
  };

  // Listen for new low stock alerts
  useEffect(() => {
    if (!user?.id || !selectedShop) return;

    const channel = supabase
      .channel('low-stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'low_stock_alerts',
          filter: `shop_id=eq.${selectedShop}`
        },
        (payload) => {
          toast.warning("New low stock alert detected!", {
            description: "Stock level has fallen below the minimum threshold"
          });
          setStockLastUpdated(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedShop, user?.id]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchStock();
      setStockLastUpdated(new Date());
      toast.success("Stock data refreshed");
    } catch (error) {
      toast.error("Failed to refresh stock data");
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!selectedShop) {
    return (
      <Card>
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <h3 className="font-medium flex items-center">
            <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
            Real-time Stock Status
          </h3>
        </div>
        <CardContent className="pt-6 text-center text-gray-500">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No Store Selected</p>
          <p className="text-sm">Please select a store to view real-time stock status</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gray-50 p-4 flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
          Real-time Stock Status
        </h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-t">
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stockStatus && stockStatus.length > 0 ? (
              stockStatus.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{item.name}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`font-medium ${
                        item.currentStock === 0 ? 'text-red-600' : 
                        item.currentStock <= item.reorderPoint ? 'text-yellow-600' : 
                        'text-gray-900'
                      }`}>
                        {item.currentStock}
                      </div>
                      {item.hasAlert && (
                        <AlertTriangle className="ml-2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm">
                    ₹{((item.currentStock || 0) * (item.price || 0)).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status.color}`}>
                      {item.status.text}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  {!stockStatus ? 'Loading stock data...' : 'No stock data available for this store'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardContent className="pt-0 pb-4">
        <div className="mt-4 text-xs text-gray-500">
          Last refreshed: {stockLastUpdated.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockRealtimeView;
