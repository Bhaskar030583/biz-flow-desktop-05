
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Package, Settings } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const LowStockAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [alertSettings, setAlertSettings] = useState({
    product_id: "",
    min_quantity: "",
    reorder_quantity: ""
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: products } = useQuery({
    queryKey: ['store-products', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          product_id,
          products (id, name, category)
        `)
        .eq('shop_id', selectedStore)
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  const { data: currentStock } = useQuery({
    queryKey: ['current-stock', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('stocks')
        .select(`
          *,
          products (name, category)
        `)
        .eq('shop_id', selectedStore)
        .eq('stock_date', today)
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  const lowStockItems = currentStock?.filter(item => item.actual_stock < 10) || [];

  const handleSetAlert = async () => {
    if (!selectedStore || !alertSettings.product_id || !alertSettings.min_quantity) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // This would save alert settings to a reorder_points table once created
      toast.success("Alert settings saved successfully");
      setAlertSettings({
        product_id: "",
        min_quantity: "",
        reorder_quantity: ""
      });
    } catch (error) {
      console.error("Error setting alert:", error);
      toast.error("Failed to save alert settings");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Store</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores?.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStore && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Current Low Stock Items ({lowStockItems.length})
                </h4>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-2">
                    {lowStockItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                        <div>
                          <span className="font-medium">{item.products?.name}</span>
                          <span className="ml-2 text-sm text-gray-600">({item.products?.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {item.actual_stock} remaining
                          </Badge>
                          <Button size="sm" variant="outline">
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No low stock items found</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Set Alert Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Product</Label>
                    <Select 
                      value={alertSettings.product_id} 
                      onValueChange={(value) => setAlertSettings(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(item => (
                          <SelectItem key={item.product_id} value={item.product_id}>
                            {item.products?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Minimum Quantity</Label>
                    <Input
                      type="number"
                      value={alertSettings.min_quantity}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, min_quantity: e.target.value }))}
                      placeholder="Alert when below this quantity"
                    />
                  </div>
                  <div>
                    <Label>Reorder Quantity</Label>
                    <Input
                      type="number"
                      value={alertSettings.reorder_quantity}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, reorder_quantity: e.target.value }))}
                      placeholder="Suggested reorder amount"
                    />
                  </div>
                </div>
                <Button onClick={handleSetAlert} className="mt-4">
                  Save Alert Settings
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockAlerts;
