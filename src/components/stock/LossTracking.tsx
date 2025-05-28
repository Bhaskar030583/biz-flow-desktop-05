
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Package, Calendar, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const LossTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [formData, setFormData] = useState({
    product_id: "",
    shop_id: "",
    shift_id: "",
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
      return data?.map(ps => ps.products).filter(Boolean) || [];
    },
    enabled: !!selectedStore && !!user?.id
  });

  // Fetch shifts for selected store
  const { data: shifts } = useQuery({
    queryKey: ['store-shifts', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name, start_time, end_time')
        .eq('store_id', selectedStore);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  // Fetch losses with proper error handling and data enrichment
  const { data: losses, isLoading } = useQuery({
    queryKey: ['losses', selectedStore],
    queryFn: async () => {
      // Get losses
      const { data: lossesData, error } = await supabase
        .from('losses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .eq(selectedStore ? 'shop_id' : 'shop_id', selectedStore || undefined);
      
      if (error) throw error;
      if (!lossesData?.length) return [];

      // Get products data
      const productIds = [...new Set(lossesData.map(loss => loss.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);

      // Get shops data
      const shopIds = [...new Set(lossesData.map(loss => loss.shop_id))];
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds);

      // Get shifts data
      const shiftIds = [...new Set(lossesData.filter(loss => loss.shift_id).map(loss => loss.shift_id))];
      const { data: shiftsData } = shiftIds.length ? await supabase
        .from('hr_shifts')
        .select('id, shift_name')
        .in('id', shiftIds) : { data: [] };

      // Create lookup maps
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const shopsMap = new Map(shopsData?.map(s => [s.id, s]) || []);
      const shiftsMap = new Map(shiftsData?.map(s => [s.id, s]) || []);

      // Combine data
      return lossesData.map(loss => ({
        ...loss,
        products: productsMap.get(loss.product_id),
        shops: shopsMap.get(loss.shop_id),
        hr_shifts: loss.shift_id ? shiftsMap.get(loss.shift_id) : null
      }));
    },
    enabled: !!user?.id
  });

  // Create loss mutation
  const createLossMutation = useMutation({
    mutationFn: async (lossData: any) => {
      const { error } = await supabase
        .from('losses')
        .insert({
          ...lossData,
          user_id: user?.id,
          quantity_lost: parseInt(lossData.quantity_lost)
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loss recorded successfully");
      setFormData({
        product_id: "",
        shop_id: "",
        shift_id: "",
        quantity_lost: "",
        loss_type: "",
        reason: "",
        operator_name: ""
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['losses'] });
    },
    onError: (error: any) => {
      toast.error("Failed to record loss: " + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.shop_id || !formData.quantity_lost || !formData.loss_type) {
      toast.error("Please fill all required fields");
      return;
    }
    createLossMutation.mutate(formData);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Loss Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stores</SelectItem>
                  {stores?.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Loss
            </Button>
          </div>

          {showForm && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Store *</Label>
                      <Select 
                        value={formData.shop_id} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, shop_id: value }));
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
                        value={formData.product_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Shift</Label>
                      <Select 
                        value={formData.shift_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, shift_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts?.map(shift => (
                            <SelectItem key={shift.id} value={shift.id}>
                              {shift.shift_name} ({shift.start_time} - {shift.end_time})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantity Lost *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.quantity_lost}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity_lost: e.target.value }))}
                        placeholder="Enter quantity"
                      />
                    </div>

                    <div>
                      <Label>Loss Type *</Label>
                      <Select 
                        value={formData.loss_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, loss_type: value }))}
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
                      <Label>Operator Name</Label>
                      <Input
                        value={formData.operator_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value }))}
                        placeholder="Enter operator name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Describe the reason for loss"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createLossMutation.isPending}>
                      {createLossMutation.isPending ? "Recording..." : "Record Loss"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading losses...</div>
            ) : losses?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No losses recorded yet</p>
              </div>
            ) : (
              losses?.map(loss => (
                <Card key={loss.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{loss.products?.name}</h4>
                        <p className="text-sm text-gray-600">{loss.shops?.name}</p>
                      </div>
                      <Badge className={getLossTypeColor(loss.loss_type)}>
                        {loss.loss_type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="ml-1 font-medium">{loss.quantity_lost}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-1">{format(new Date(loss.loss_date), "MMM dd, yyyy")}</span>
                      </div>
                      {loss.hr_shifts && (
                        <div>
                          <span className="text-gray-600">Shift:</span>
                          <span className="ml-1">{loss.hr_shifts.shift_name}</span>
                        </div>
                      )}
                      {loss.operator_name && (
                        <div>
                          <span className="text-gray-600">Operator:</span>
                          <span className="ml-1">{loss.operator_name}</span>
                        </div>
                      )}
                    </div>
                    {loss.reason && (
                      <p className="text-sm text-gray-600 mt-2">{loss.reason}</p>
                    )}
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
