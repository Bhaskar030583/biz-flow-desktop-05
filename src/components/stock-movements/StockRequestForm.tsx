
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface StockRequestFormProps {
  onRequestCreated: () => void;
}

export const StockRequestForm = ({ onRequestCreated }: StockRequestFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requesting_hr_store_id: "",
    fulfilling_hr_store_id: "",
    product_id: "",
    requested_quantity: "",
    notes: ""
  });

  // Fetch HR stores
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
        .select('id, name, category')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create requests');
      return;
    }

    if (!formData.requesting_hr_store_id || !formData.fulfilling_hr_store_id || 
        !formData.product_id || !formData.requested_quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.requesting_hr_store_id === formData.fulfilling_hr_store_id) {
      toast.error('Requesting and fulfilling stores must be different');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('stock_requests')
        .insert({
          user_id: user.id,
          requesting_store_id: formData.requesting_hr_store_id,
          fulfilling_store_id: formData.fulfilling_hr_store_id,
          requesting_hr_store_id: formData.requesting_hr_store_id,
          fulfilling_hr_store_id: formData.fulfilling_hr_store_id,
          product_id: formData.product_id,
          requested_quantity: parseInt(formData.requested_quantity),
          notes: formData.notes || null,
          request_date: new Date().toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Stock request created successfully');
      
      // Reset form
      setFormData({
        requesting_hr_store_id: "",
        fulfilling_hr_store_id: "",
        product_id: "",
        requested_quantity: "",
        notes: ""
      });

      onRequestCreated();
    } catch (error) {
      console.error('Error creating stock request:', error);
      toast.error('Failed to create stock request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="requesting_store">Requesting Store *</Label>
          <Select
            value={formData.requesting_hr_store_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, requesting_hr_store_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select requesting store" />
            </SelectTrigger>
            <SelectContent>
              {stores?.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fulfilling_store">Fulfilling Store *</Label>
          <Select
            value={formData.fulfilling_hr_store_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, fulfilling_hr_store_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fulfilling store" />
            </SelectTrigger>
            <SelectContent>
              {stores?.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="product">Product *</Label>
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
                {product.name} ({product.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="requested_quantity">Requested Quantity *</Label>
        <Input
          id="requested_quantity"
          type="number"
          min="1"
          value={formData.requested_quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, requested_quantity: e.target.value }))}
          placeholder="Enter quantity needed"
          required
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this request..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating Request...' : 'Create Stock Request'}
      </Button>
    </form>
  );
};
