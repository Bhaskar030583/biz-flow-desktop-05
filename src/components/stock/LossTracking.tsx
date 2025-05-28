
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Package, TrendingDown, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const LossTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<string>("_all");
  const [newLoss, setNewLoss] = useState({
    product_id: "",
    shop_id: "",
    quantity_lost: "",
    loss_type: "",
    reason: "",
    operator_name: ""
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

  // Fetch products for selected store
  const { data: products } = useQuery({
    queryKey: ['store-products', selectedStore],
    queryFn: async () => {
      if (!selectedStore || selectedStore === "_all") return [];
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          product_id,
          products (id, name, category, price, cost_price)
        `)
        .eq('shop_id', selectedStore)
        .eq('user_id', user?.id);
      if (error) throw error;
      return data?.map(ps => ps.products).filter(Boolean) || [];
    },
    enabled: !!selectedStore && selectedStore !== "_all" && !!user?.id
  });

  // Fetch losses with proper data joining
  const { data: losses, isLoading: lossesLoading } = useQuery({
    queryKey: ['losses', selectedStore],
    queryFn: async () => {
      // Get losses
      let query = supabase
        .from('losses')
        .select('*')
        .eq('user_id', user?.id)
        .order('loss_date', { ascending: false });

      if (selectedStore && selectedStore !== "_all") {
        query = query.eq('shop_id', selectedStore);
      }

      const { data: lossesData, error } = await query;
      if (error) throw error;
      if (!lossesData?.length) return [];

      // Get products data
      const productIds = [...new Set(lossesData.map(loss => loss.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .in('id', productIds);

      // Get shops data
      const shopIds = [...new Set(lossesData.map(loss => loss.shop_id))];
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds);

      // Create lookup maps
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const shopsMap = new Map(shopsData?.map(s => [s.id, s]) || []);

      // Combine data
      return lossesData.map(loss => ({
        ...loss,
        products: productsMap.get(loss.product_id),
        shops: shopsMap.get(loss.shop_id)
      }));
    },
    enabled: !!user?.id
  });

  // Create loss mutation
  const createLossMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('losses')
        .insert({
          ...data,
          user_id: user?.id,
          quantity_lost: parseInt(data.quantity_lost),
          loss_date: new Date().toISOString().split('T')[0]
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loss recorded successfully");
      setNewLoss({
        product_id: "",
        shop_id: "",
        quantity_lost: "",
        loss_type: "",
        reason: "",
        operator_name: ""
      });
      queryClient.invalidateQueries({ queryKey: ['losses'] });
    },
    onError: (error: any) => {
      toast.error("Failed to record loss: " + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoss.product_id || !newLoss.shop_id || !newLoss.quantity_lost || !newLoss.loss_type) {
      toast.error("Please fill all required fields");
      return;
    }
    createLossMutation.mutate(newLoss);
  };

  const getLossTypeColor = (type: string) => {
    const colors = {
      theft: "bg-red-100 text-red-800",
      damage: "bg-orange-100 text-orange-800",
      expiry: "bg-yellow-100 text-yellow-800",
      spillage: "bg-blue-100 text-blue-800",
      breakage: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const calculateLossValue = (loss: any) => {
    const cost = loss.products?.cost_price || loss.products?.price || 0;
    return loss.quantity_lost * cost;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Loss Tracking
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
          </div>

          {/* Record New Loss */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg">Record New Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Store *</Label>
                    <Select 
                      value={newLoss.shop_id} 
                      onValueChange={(value) => setNewLoss(prev => ({ ...prev, shop_id: value }))}
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
                      value={newLoss.product_id} 
                      onValueChange={(value) => setNewLoss(prev => ({ ...prev, product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(product => (
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
                    <Label>Loss Type *</Label>
                    <Select 
                      value={newLoss.loss_type} 
                      onValueChange={(value) => setNewLoss(prev => ({ ...prev, loss_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select loss type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="damage">Damage</SelectItem>
                        <SelectItem value="expiry">Expiry</SelectItem>
                        <SelectItem value="spillage">Spillage</SelectItem>
                        <SelectItem value="breakage">Breakage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantity Lost *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newLoss.quantity_lost}
                      onChange={(e) => setNewLoss(prev => ({ ...prev, quantity_lost: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <Label>Operator Name</Label>
                    <Input
                      value={newLoss.operator_name}
                      onChange={(e) => setNewLoss(prev => ({ ...prev, operator_name: e.target.value }))}
                      placeholder="Enter operator name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={newLoss.reason}
                      onChange={(e) => setNewLoss(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Describe the reason for loss"
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={createLossMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {createLossMutation.isPending ? "Recording..." : "Record Loss"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Loss History */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Loss History</h3>
            {lossesLoading ? (
              <div className="text-center py-8">Loading losses...</div>
            ) : losses?.length === 0 ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-green-600 font-medium">No losses recorded! Great job on inventory management.</p>
                </CardContent>
              </Card>
            ) : (
              losses?.map(loss => (
                <Card key={loss.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{loss.products?.name}</h4>
                          <Badge className={getLossTypeColor(loss.loss_type)}>
                            {loss.loss_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{loss.shops?.name}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Quantity Lost:</span>
                            <span className="ml-1 font-medium text-red-600">{loss.quantity_lost}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Value:</span>
                            <span className="ml-1 font-medium">₹{calculateLossValue(loss).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <span className="ml-1">{format(new Date(loss.loss_date), "MMM dd, yyyy")}</span>
                          </div>
                          {loss.operator_name && (
                            <div>
                              <span className="text-gray-600">Operator:</span>
                              <span className="ml-1">{loss.operator_name}</span>
                            </div>
                          )}
                        </div>
                        {loss.reason && (
                          <div className="mt-2">
                            <span className="text-gray-600 text-sm">Reason:</span>
                            <p className="text-sm mt-1">{loss.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LossTracking;
