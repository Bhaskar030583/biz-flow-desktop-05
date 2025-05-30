
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LowStockAlert() {
  const { user } = useAuth();

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current stock levels
      const { data: stocks, error: stockError } = await supabase
        .from('stocks')
        .select(`
          product_id,
          actual_stock,
          hr_shop_id,
          products (name),
          hr_stores!stocks_hr_shop_id_fkey (store_name)
        `)
        .eq('user_id', user?.id)
        .eq('stock_date', today);

      if (stockError) throw stockError;

      // Get reorder points
      const { data: reorderPoints, error: reorderError } = await supabase
        .from('reorder_points')
        .select('product_id, hr_shop_id, minimum_stock')
        .eq('user_id', user?.id);

      if (reorderError) throw reorderError;

      // Find items below reorder point
      const lowStockItems = stocks?.filter(stock => {
        const reorderPoint = reorderPoints?.find(
          rp => rp.product_id === stock.product_id && rp.hr_shop_id === stock.hr_shop_id
        );
        return reorderPoint && stock.actual_stock <= reorderPoint.minimum_stock;
      }) || [];

      return lowStockItems.map(item => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product',
        store_name: item.hr_stores?.store_name || 'Unknown Store',
        minimum_stock: reorderPoints?.find(
          rp => rp.product_id === item.product_id && rp.hr_shop_id === item.hr_shop_id
        )?.minimum_stock || 0
      }));
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['unresolved-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_alerts')
        .select(`
          *,
          products (name),
          hr_stores!low_stock_alerts_hr_shop_id_fkey (store_name)
        `)
        .eq('user_id', user?.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const totalAlerts = (lowStockItems?.length || 0) + (alerts?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alerts
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalAlerts}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {totalAlerts === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No low stock alerts</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {lowStockItems?.map((item) => (
              <div key={`${item.product_id}-${item.hr_shop_id}`} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">{item.store_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">
                    {item.actual_stock} left
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.minimum_stock}
                  </p>
                </div>
              </div>
            ))}
            
            {alerts?.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.products?.name}</p>
                  <p className="text-xs text-muted-foreground">{alert.hr_stores?.store_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {alert.current_stock} left
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {alert.minimum_threshold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
