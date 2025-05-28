
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, AlertTriangle, Package, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const LowStockAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<string>("_all");
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [newReorderPoint, setNewReorderPoint] = useState({
    product_id: "",
    shop_id: "",
    minimum_stock: "",
    reorder_quantity: ""
  });

  // Fetch stores
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

  // Fetch active alerts with proper data joining
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['low-stock-alerts', selectedStore],
    queryFn: async () => {
      // Get alerts
      let query = supabase
        .from('low_stock_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_resolved', false)
        .order('alert_date', { ascending: false });

      if (selectedStore && selectedStore !== "_all") {
        query = query.eq('shop_id', selectedStore);
      }

      const { data: alertsData, error } = await query;
      if (error) throw error;
      if (!alertsData?.length) return [];

      // Get products data
      const productIds = [...new Set(alertsData.map(alert => alert.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);

      // Get shops data
      const shopIds = [...new Set(alertsData.map(alert => alert.shop_id))];
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds);

      // Create lookup maps
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const shopsMap = new Map(shopsData?.map(s => [s.id, s]) || []);

      // Combine data
      return alertsData.map(alert => ({
        ...alert,
        products: productsMap.get(alert.product_id),
        shops: shopsMap.get(alert.shop_id)
      }));
    },
    enabled: !!user?.id
  });

  // Fetch reorder points with proper data joining
  const { data: reorderPoints } = useQuery({
    queryKey: ['reorder-points', selectedStore],
    queryFn: async () => {
      // Get reorder points
      let query = supabase
        .from('reorder_points')
        .select('*')
        .eq('user_id', user?.id);

      if (selectedStore && selectedStore !== "_all") {
        query = query.eq('shop_id', selectedStore);
      }

      const { data: reorderPointsData, error } = await query;
      if (error) throw error;
      if (!reorderPointsData?.length) return [];

      // Get products data
      const productIds = [...new Set(reorderPointsData.map(rp => rp.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);

      // Get shops data
      const shopIds = [...new Set(reorderPointsData.map(rp => rp.shop_id))];
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds);

      // Create lookup maps
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const shopsMap = new Map(shopsData?.map(s => [s.id, s]) || []);

      // Combine data
      return reorderPointsData.map(rp => ({
        ...rp,
        products: productsMap.get(rp.product_id),
        shops: shopsMap.get(rp.shop_id)
      }));
    },
    enabled: !!user?.id
  });

  // Fetch available products for reorder point setup
  const { data: availableProducts } = useQuery({
    queryKey: ['available-products', selectedStore],
    queryFn: async () => {
      if (!selectedStore || selectedStore === "_all") return [];
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          product_id,
          products (id, name, category)
        `)
        .eq('shop_id', selectedStore)
        .eq('user_id', user?.id);
      if (error) throw error;
      return data?.map(ps => ps.products).filter(Boolean) || [];
    },
    enabled: !!selectedStore && selectedStore !== "_all" && !!user?.id
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('low_stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alert resolved");
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
    onError: (error: any) => {
      toast.error("Failed to resolve alert: " + error.message);
    }
  });

  // Create reorder point mutation
  const createReorderPointMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('reorder_points')
        .insert({
          ...data,
          user_id: user?.id,
          minimum_stock: parseInt(data.minimum_stock),
          reorder_quantity: parseInt(data.reorder_quantity)
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reorder point set successfully");
      setNewReorderPoint({
        product_id: "",
        shop_id: "",
        minimum_stock: "",
        reorder_quantity: ""
      });
      queryClient.invalidateQueries({ queryKey: ['reorder-points'] });
    },
    onError: (error: any) => {
      toast.error("Failed to set reorder point: " + error.message);
    }
  });

  const handleCreateReorderPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReorderPoint.product_id || !newReorderPoint.shop_id || !newReorderPoint.minimum_stock) {
      toast.error("Please fill all required fields");
      return;
    }
    createReorderPointMutation.mutate(newReorderPoint);
  };

  const getAlertSeverity = (currentStock: number, threshold: number) => {
    const ratio = currentStock / threshold;
    if (ratio <= 0.2) return { level: "critical", color: "bg-red-100 text-red-800" };
    if (ratio <= 0.5) return { level: "high", color: "bg-orange-100 text-orange-800" };
    return { level: "medium", color: "bg-yellow-100 text-yellow-800" };
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
          <div className="flex justify-between items-center">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Stores</SelectItem>
                {stores?.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setShowReorderSettings(!showReorderSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reorder Settings
            </Button>
          </div>

          {/* Active Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Alerts</h3>
            {alertsLoading ? (
              <div className="text-center py-8">Loading alerts...</div>
            ) : alerts?.length === 0 ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-green-600 font-medium">No low stock alerts! All products are well stocked.</p>
                </CardContent>
              </Card>
            ) : (
              alerts?.map(alert => {
                const severity = getAlertSeverity(alert.current_stock, alert.minimum_threshold);
                return (
                  <Card key={alert.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{alert.products?.name}</h4>
                            <Badge className={severity.color}>
                              {severity.level}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.shops?.name}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Current Stock:</span>
                              <span className="ml-1 font-medium text-red-600">{alert.current_stock}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Minimum:</span>
                              <span className="ml-1">{alert.minimum_threshold}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Alert Date:</span>
                              <span className="ml-1">{format(new Date(alert.alert_date), "MMM dd, yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Reorder Settings */}
          {showReorderSettings && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Reorder Point Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateReorderPoint} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Store *</Label>
                      <Select 
                        value={newReorderPoint.shop_id} 
                        onValueChange={(value) => {
                          setNewReorderPoint(prev => ({ ...prev, shop_id: value }));
                          setSelectedStore(value);
                        }}
                      >
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

                    <div>
                      <Label>Product *</Label>
                      <Select 
                        value={newReorderPoint.product_id} 
                        onValueChange={(value) => setNewReorderPoint(prev => ({ ...prev, product_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts?.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>{product.name}</span>
                                <span className="text-sm text-gray-500">({product.category})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Minimum Stock Level *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newReorderPoint.minimum_stock}
                        onChange={(e) => setNewReorderPoint(prev => ({ ...prev, minimum_stock: e.target.value }))}
                        placeholder="Enter minimum stock"
                      />
                    </div>

                    <div>
                      <Label>Reorder Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newReorderPoint.reorder_quantity}
                        onChange={(e) => setNewReorderPoint(prev => ({ ...prev, reorder_quantity: e.target.value }))}
                        placeholder="Enter reorder quantity"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={createReorderPointMutation.isPending}>
                    {createReorderPointMutation.isPending ? "Setting..." : "Set Reorder Point"}
                  </Button>
                </form>

                {/* Existing Reorder Points */}
                <div className="space-y-4">
                  <h4 className="font-medium">Current Reorder Points</h4>
                  {reorderPoints?.length ? (
                    reorderPoints.map(point => (
                      <div key={point.id} className="flex justify-between items-center p-3 bg-white rounded border">
                        <div>
                          <span className="font-medium">{point.products?.name}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            at {point.shops?.name}
                          </span>
                        </div>
                        <div className="text-sm">
                          Min: {point.minimum_stock} | Reorder: {point.reorder_quantity}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No reorder points set</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockAlerts;
