
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function StockRequestForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestingStoreId, setRequestingStoreId] = useState("");
  const [fulfillingStoreId, setFulfillingStoreId] = useState("");
  const [productId, setProductId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch stores
  const { data: stores } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const { data, error } = await supabase
        .from('stock_requests')
        .insert({
          user_id: user?.id,
          requesting_store_id: requestData.requesting_store_id,
          fulfilling_store_id: requestData.fulfilling_store_id,
          requesting_hr_store_id: requestData.requesting_hr_store_id,
          fulfilling_hr_store_id: requestData.fulfilling_hr_store_id,
          product_id: requestData.product_id,
          requested_quantity: requestData.requested_quantity,
          notes: requestData.notes
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Stock request created successfully");
      queryClient.invalidateQueries({ queryKey: ['stock-requests'] });
      // Reset form
      setRequestingStoreId("");
      setFulfillingStoreId("");
      setProductId("");
      setRequestedQuantity("");
      setNotes("");
    },
    onError: (error) => {
      console.error('Error creating stock request:', error);
      toast.error("Failed to create stock request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestingStoreId || !fulfillingStoreId || !productId || !requestedQuantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    createRequestMutation.mutate({
      requesting_store_id: requestingStoreId,
      fulfilling_store_id: fulfillingStoreId,
      requesting_hr_store_id: requestingStoreId,
      fulfilling_hr_store_id: fulfillingStoreId,
      product_id: productId,
      requested_quantity: parseInt(requestedQuantity),
      notes: notes
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Stock Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requesting-store">Requesting Store</Label>
              <Select value={requestingStoreId} onValueChange={setRequestingStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select requesting store" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fulfilling-store">Fulfilling Store</Label>
              <Select value={fulfillingStoreId} onValueChange={setFulfillingStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fulfilling store" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="product">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Requested Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={requestedQuantity}
              onChange={(e) => setRequestedQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or comments"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createRequestMutation.isPending}
          >
            {createRequestMutation.isPending ? "Creating..." : "Create Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
