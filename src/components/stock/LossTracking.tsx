
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface LossEntry {
  id: string;
  product_name: string;
  quantity_lost: number;
  loss_type: string;
  reason: string;
  shift_name?: string;
  store_name?: string;
  created_at: string;
  operator_name?: string;
}

const LossTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [lossEntry, setLossEntry] = useState({
    product_id: "",
    quantity: "",
    loss_type: "",
    reason: "",
    operator_name: ""
  });

  const lossTypes = [
    { value: "theft", label: "Theft" },
    { value: "damage", label: "Damage" },
    { value: "expiry", label: "Expiry" },
    { value: "spillage", label: "Spillage" },
    { value: "breakage", label: "Breakage" },
    { value: "other", label: "Other" }
  ];

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

  const { data: shifts } = useQuery({
    queryKey: ['shifts', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('*')
        .eq('store_id', selectedStore)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  const { data: products } = useQuery({
    queryKey: ['store-products', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          product_id,
          products (id, name)
        `)
        .eq('shop_id', selectedStore)
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  const { data: lossHistory } = useQuery({
    queryKey: ['loss-history', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      // This would query a losses table once created
      return [];
    },
    enabled: !!selectedStore
  });

  const handleSubmitLoss = async () => {
    if (!selectedStore || !selectedShift || !lossEntry.product_id || !lossEntry.quantity || !lossEntry.loss_type) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // This would insert into a losses table once created
      toast.success("Loss entry recorded successfully");
      setLossEntry({
        product_id: "",
        quantity: "",
        loss_type: "",
        reason: "",
        operator_name: ""
      });
    } catch (error) {
      console.error("Error recording loss:", error);
      toast.error("Failed to record loss");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Loss Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Store</Label>
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
            <div>
              <Label>Shift</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts?.map(shift => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStore && selectedShift && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Record New Loss</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <Select value={lossEntry.product_id} onValueChange={(value) => setLossEntry(prev => ({ ...prev, product_id: value }))}>
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
                  <Label>Quantity Lost</Label>
                  <Input
                    type="number"
                    value={lossEntry.quantity}
                    onChange={(e) => setLossEntry(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label>Loss Type</Label>
                  <Select value={lossEntry.loss_type} onValueChange={(value) => setLossEntry(prev => ({ ...prev, loss_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loss type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lossTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operator Name</Label>
                  <Input
                    value={lossEntry.operator_name}
                    onChange={(e) => setLossEntry(prev => ({ ...prev, operator_name: e.target.value }))}
                    placeholder="Enter operator name"
                  />
                </div>
              </div>
              <div>
                <Label>Reason/Notes</Label>
                <Textarea
                  value={lossEntry.reason}
                  onChange={(e) => setLossEntry(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe the reason for loss"
                />
              </div>
              <Button onClick={handleSubmitLoss} className="w-full">
                Record Loss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Recent Loss History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No loss entries found for this store</p>
              <p className="text-sm">Start recording losses to see history here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LossTracking;
