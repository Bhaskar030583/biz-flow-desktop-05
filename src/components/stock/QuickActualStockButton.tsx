
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface Shop {
  id: string;
  name: string;
}

interface QuickActualStockButtonProps {
  onStockAdded: () => void;
}

const QuickActualStockButton = ({ onStockAdded }: QuickActualStockButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [actualStock, setActualStock] = useState("");
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (open) {
      fetchProductsAndShops();
    }
  }, [open]);

  const fetchProductsAndShops = async () => {
    try {
      const [productsResult, shopsResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name')
          .eq('user_id', user?.id)
          .order('name'),
        supabase
          .from('shops')
          .select('id, name')
          .eq('user_id', user?.id)
          .order('name')
      ]);

      if (productsResult.error) throw productsResult.error;
      if (shopsResult.error) throw shopsResult.error;

      setProducts(productsResult.data || []);
      setShops(shopsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products and shops');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedShop || !actualStock) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Check if there's an existing stock entry for this date, product, and shop
      const { data: existingStock, error: fetchError } = await supabase
        .from('stocks')
        .select('id, opening_stock, closing_stock, stock_added')
        .eq('product_id', selectedProduct)
        .eq('shop_id', selectedShop)
        .eq('stock_date', stockDate)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const actualStockValue = parseInt(actualStock);

      if (existingStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            actual_stock: actualStockValue,
            closing_stock: actualStockValue
          })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
        toast.success('Actual stock updated successfully');
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: selectedProduct,
            shop_id: selectedShop,
            stock_date: stockDate,
            opening_stock: actualStockValue,
            closing_stock: actualStockValue,
            actual_stock: actualStockValue,
            stock_added: 0,
            user_id: user?.id
          });

        if (insertError) throw insertError;
        toast.success('Actual stock added successfully');
      }

      // Reset form
      setSelectedProduct("");
      setSelectedShop("");
      setActualStock("");
      setOpen(false);
      onStockAdded();

    } catch (error: any) {
      console.error('Error adding actual stock:', error);
      toast.error(error.message || 'Failed to add actual stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Add Actual Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Actual Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={stockDate}
              onChange={(e) => setStockDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop">Shop</Label>
            <Select value={selectedShop} onValueChange={setSelectedShop} required>
              <SelectTrigger>
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualStock">Actual Stock Quantity</Label>
            <Input
              id="actualStock"
              type="number"
              min="0"
              value={actualStock}
              onChange={(e) => setActualStock(e.target.value)}
              placeholder="Enter actual stock count"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickActualStockButton;
