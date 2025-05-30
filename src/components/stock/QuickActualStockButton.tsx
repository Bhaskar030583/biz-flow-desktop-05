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
  const [currentStockInfo, setCurrentStockInfo] = useState<{
    openingStock: number;
    soldQuantity: number;
    expectedClosing: number;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      fetchProductsAndShops();
    }
  }, [open]);

  React.useEffect(() => {
    if (selectedProduct && selectedShop && stockDate) {
      fetchCurrentStockInfo();
    } else {
      setCurrentStockInfo(null);
    }
  }, [selectedProduct, selectedShop, stockDate]);

  const fetchProductsAndShops = async () => {
    try {
      const [productsResult, shopsResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name')
          .eq('user_id', user?.id)
          .order('name'),
        supabase
          .from('hr_stores')
          .select('id, store_name')
          .order('store_name')
      ]);

      if (productsResult.error) throw productsResult.error;
      if (shopsResult.error) throw shopsResult.error;

      setProducts(productsResult.data || []);
      
      const transformedShops = shopsResult.data?.map(store => ({
        id: store.id,
        name: store.store_name
      })) || [];
      
      setShops(transformedShops);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products and shops');
    }
  };

  const fetchCurrentStockInfo = async () => {
    try {
      // Get the latest stock entry for this product and shop
      const { data: latestStock, error: stockError } = await supabase
        .from('stocks')
        .select('opening_stock, closing_stock, actual_stock, stock_date')
        .eq('product_id', selectedProduct)
        .eq('shop_id', selectedShop)
        .order('stock_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (stockError) throw stockError;

      // Calculate sold quantity from bills for the selected date
      const { data: billItems, error: billError } = await supabase
        .from('bill_items')
        .select(`
          quantity,
          bills!inner(
            bill_date,
            user_id
          )
        `)
        .eq('product_id', selectedProduct)
        .eq('bills.user_id', user?.id)
        .gte('bills.bill_date', stockDate + 'T00:00:00')
        .lte('bills.bill_date', stockDate + 'T23:59:59');

      if (billError) throw billError;

      const soldQuantity = billItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Determine opening stock for the selected date
      let openingStock = 0;
      
      if (latestStock) {
        // If we have previous stock data
        if (latestStock.stock_date === stockDate) {
          // Same date, use the existing opening stock
          openingStock = latestStock.opening_stock;
        } else {
          // Different date, previous day's actual stock becomes today's opening
          openingStock = latestStock.actual_stock;
        }
      } else {
        // No previous stock data, check if product is assigned to shop
        const { data: assignment } = await supabase
          .from('product_shops')
          .select('id')
          .eq('product_id', selectedProduct)
          .eq('shop_id', selectedShop)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (!assignment) {
          toast.error('Product is not assigned to this shop');
          return;
        }
        openingStock = 0;
      }

      const expectedClosing = openingStock - soldQuantity;

      setCurrentStockInfo({
        openingStock,
        soldQuantity,
        expectedClosing
      });

    } catch (error) {
      console.error('Error fetching stock info:', error);
      toast.error('Failed to load current stock information');
    }
  };

  const resetForm = () => {
    setSelectedProduct("");
    setActualStock("");
    setCurrentStockInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedShop || !actualStock || !currentStockInfo) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const actualStockValue = parseInt(actualStock);
      const { openingStock, soldQuantity, expectedClosing } = currentStockInfo;

      // Check if there's an existing stock entry for this date
      const { data: existingStock, error: fetchError } = await supabase
        .from('stocks')
        .select('id')
        .eq('product_id', selectedProduct)
        .eq('shop_id', selectedShop)
        .eq('stock_date', stockDate)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const stockData = {
        product_id: selectedProduct,
        shop_id: selectedShop,
        stock_date: stockDate,
        opening_stock: openingStock,
        closing_stock: expectedClosing,
        actual_stock: actualStockValue,
        stock_added: 0, // This can be updated separately if needed
        user_id: user?.id
      };

      if (existingStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            actual_stock: actualStockValue,
            closing_stock: expectedClosing
          })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
        toast.success('Actual stock updated successfully');
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert(stockData);

        if (insertError) throw insertError;
        toast.success('Stock entry created successfully');
      }

      resetForm();
      onStockAdded();

    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct("");
    setSelectedShop("");
    setActualStock("");
    setStockDate(new Date().toISOString().split('T')[0]);
    setCurrentStockInfo(null);
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

          {currentStockInfo && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Stock Information</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Opening Stock:</span>
                  <span className="ml-2 font-medium">{currentStockInfo.openingStock}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sold Today:</span>
                  <span className="ml-2 font-medium text-red-600">{currentStockInfo.soldQuantity}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Expected Closing:</span>
                  <span className="ml-2 font-medium text-blue-600">{currentStockInfo.expectedClosing}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="actualStock">Actual Stock Count</Label>
            <Input
              id="actualStock"
              type="number"
              min="0"
              value={actualStock}
              onChange={(e) => setActualStock(e.target.value)}
              placeholder={currentStockInfo ? `Expected: ${currentStockInfo.expectedClosing}` : "Enter actual count"}
              required
            />
            {currentStockInfo && actualStock && (
              <div className="text-xs">
                {parseInt(actualStock) < currentStockInfo.expectedClosing && (
                  <span className="text-red-600">
                    Shortage: {currentStockInfo.expectedClosing - parseInt(actualStock)} units
                  </span>
                )}
                {parseInt(actualStock) > currentStockInfo.expectedClosing && (
                  <span className="text-orange-600">
                    Excess: {parseInt(actualStock) - currentStockInfo.expectedClosing} units
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button type="submit" disabled={loading || !currentStockInfo}>
              {loading ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickActualStockButton;
