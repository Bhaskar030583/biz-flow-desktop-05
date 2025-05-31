
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

  // Fetch HR stores with better error handling
  const { data: stores, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      console.log('🏪 [StockRequestForm] Fetching HR stores...');
      
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (error) {
        console.error('❌ [StockRequestForm] Error fetching stores:', error);
        throw error;
      }
      
      console.log('✅ [StockRequestForm] Stores fetched:', data?.length || 0);
      return data;
    },
  });

  // Fetch products with better error handling
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('📦 [StockRequestForm] Fetching products...');
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) {
        console.error('❌ [StockRequestForm] Error fetching products:', error);
        throw error;
      }
      
      console.log('✅ [StockRequestForm] Products fetched:', data?.length || 0);
      return data;
    },
    enabled: !!user?.id,
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
      console.log('📝 [StockRequestForm] Creating stock request:', formData);

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

      if (error) {
        console.error('❌ [StockRequestForm] Error creating request:', error);
        throw error;
      }

      console.log('✅ [StockRequestForm] Stock request created successfully');
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
      console.error('❌ [StockRequestForm] Error creating stock request:', error);
      toast.error(`Failed to create stock request: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (storesError || productsError) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Data</h3>
        <p className="text-red-600 text-sm mb-4">
          {storesError ? `Stores: ${storesError.message}` : ''}
          {productsError ? `Products: ${productsError.message}` : ''}
        </p>
        <p className="text-red-600 text-sm">
          Please check that you have the necessary permissions and that HR stores and products are set up correctly.
        </p>
      </div>
    );
  }

  if (storesLoading || productsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading stores and products...</p>
      </div>
    );
  }

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
              {(!stores || stores.length === 0) && (
                <SelectItem value="no-stores" disabled>
                  No stores available
                </SelectItem>
              )}
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
              {(!stores || stores.length === 0) && (
                <SelectItem value="no-stores" disabled>
                  No stores available
                </SelectItem>
              )}
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
            {(!products || products.length === 0) && (
              <SelectItem value="no-products" disabled>
                No products available
              </SelectItem>
            )}
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
        disabled={isSubmitting || !stores?.length || !products?.length}
        className="w-full"
      >
        {isSubmitting ? 'Creating Request...' : 'Create Stock Request'}
      </Button>
      
      {(!stores?.length || !products?.length) && (
        <p className="text-sm text-amber-600 text-center">
          Please ensure you have HR stores and products set up before creating requests.
        </p>
      )}
    </form>
  );
};
