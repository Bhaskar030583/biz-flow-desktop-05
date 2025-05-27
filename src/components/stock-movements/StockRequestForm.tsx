
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package, Store } from "lucide-react";

interface Shop {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface StockRequestFormProps {
  onRequestCreated: () => void;
}

export const StockRequestForm = ({ onRequestCreated }: StockRequestFormProps) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedRequestingStore, setSelectedRequestingStore] = useState("");
  const [selectedFulfillingStore, setSelectedFulfillingStore] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchShops();
      fetchProducts();
    }
  }, [user]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRequestingStore || !selectedFulfillingStore || !selectedProduct || !requestedQuantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedRequestingStore === selectedFulfillingStore) {
      toast.error('Requesting and fulfilling stores must be different');
      return;
    }

    const quantity = parseInt(requestedQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('stock_requests')
        .insert({
          user_id: user?.id,
          requesting_store_id: selectedRequestingStore,
          fulfilling_store_id: selectedFulfillingStore,
          product_id: selectedProduct,
          requested_quantity: quantity,
          notes: notes.trim() || null
        });

      if (error) throw error;

      toast.success('Stock request created successfully');
      
      // Reset form
      setSelectedRequestingStore("");
      setSelectedFulfillingStore("");
      setSelectedProduct("");
      setRequestedQuantity("");
      setNotes("");
      
      onRequestCreated();
    } catch (error) {
      console.error('Error creating stock request:', error);
      toast.error('Failed to create stock request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requesting-store">Requesting Store *</Label>
              <Select value={selectedRequestingStore} onValueChange={setSelectedRequestingStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select requesting store" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        {shop.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfilling-store">Fulfilling Store *</Label>
              <Select value={selectedFulfillingStore} onValueChange={setSelectedFulfillingStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fulfilling store" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        {shop.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
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

          <div className="space-y-2">
            <Label htmlFor="quantity">Requested Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={requestedQuantity}
              onChange={(e) => setRequestedQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for this request"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating Request...' : 'Create Stock Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
