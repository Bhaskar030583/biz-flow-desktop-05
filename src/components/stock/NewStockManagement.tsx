
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Save, RefreshCw, Plus, Package2, Store, Lock, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import StockTemplate from "./StockTemplate";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Shop {
  id: string;
  name: string;
}

interface StockItem {
  productId: string;
  productName: string;
  category: string;
  openingStock: number;
  actualStock: number;
  availableStock: number;
  stockAdded: number;
}

interface NewStockManagementProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NewStockManagement: React.FC<NewStockManagementProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchShops();
      fetchProducts();
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      loadStoreInventory();
    }
  }, [selectedShop, stockDate]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

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
        .select('id, name, price, category')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      setProducts(data || []);
      
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const loadStoreInventory = async () => {
    if (!selectedShop) return;
    
    try {
      const { data: stockData, error } = await supabase
        .from('stocks')
        .select(`
          product_id,
          opening_stock,
          actual_stock,
          closing_stock,
          stock_added,
          products (id, name, category)
        `)
        .eq('shop_id', selectedShop)
        .eq('stock_date', stockDate);

      if (error) throw error;

      const previousDay = new Date(stockDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousDate = format(previousDay, 'yyyy-MM-dd');

      const { data: previousStockData, error: prevError } = await supabase
        .from('stocks')
        .select('product_id, actual_stock')
        .eq('shop_id', selectedShop)
        .eq('stock_date', previousDate);

      if (prevError) console.error('Error fetching previous stock:', prevError);

      const newStockItems: StockItem[] = products.map(product => {
        const existingStock = stockData?.find(stock => stock.product_id === product.id);
        const previousStock = previousStockData?.find(stock => stock.product_id === product.id);
        
        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          openingStock: existingStock?.opening_stock || previousStock?.actual_stock || 0,
          actualStock: existingStock?.actual_stock || 0,
          availableStock: existingStock?.closing_stock || 0,
          stockAdded: existingStock?.stock_added || 0,
        };
      });

      setStockItems(newStockItems);
    } catch (error) {
      console.error('Error loading store inventory:', error);
      toast.error('Failed to load store inventory');
    }
  };

  const addProductToStore = (product: Product) => {
    const exists = stockItems.find(item => item.productId === product.id);
    if (exists) {
      toast.error('Product already in store inventory');
      return;
    }

    const newItem: StockItem = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      openingStock: 0,
      actualStock: 0,
      availableStock: 0,
      stockAdded: 0,
    };

    setStockItems(prev => [...prev, newItem]);
    toast.success(`${product.name} added to store inventory`);
  };

  const updateStockItem = (productId: string, field: keyof StockItem, value: number) => {
    setStockItems(prev => 
      prev.map(item => {
        if (item.productId === productId) {
          const updatedItem = { ...item, [field]: Math.max(0, value) };
          
          if (field === 'actualStock' && !isAdmin) {
            updatedItem.openingStock = Math.max(0, value);
          }
          
          if (field === 'stockAdded') {
            updatedItem.availableStock = item.availableStock + Math.max(0, value) - item.stockAdded;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const saveStockData = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    if (stockItems.length === 0) {
      toast.error('No products in store inventory');
      return;
    }

    setLoading(true);
    try {
      const stockData = stockItems.map(item => ({
        stock_date: stockDate,
        product_id: item.productId,
        shop_id: selectedShop,
        opening_stock: item.openingStock,
        closing_stock: item.availableStock,
        actual_stock: item.actualStock,
        stock_added: item.stockAdded,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .upsert(stockData, {
          onConflict: 'stock_date,product_id,shop_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Store inventory updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving stock data:', error);
      toast.error('Failed to save store inventory');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (template: any) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('user_id', user?.id)
        .in('id', template.products.map((p: any) => p.product_id));

      if (error) throw error;

      const updatedStockItems = stockItems.map(existingItem => {
        const templateProduct = template.products.find((p: any) => p.product_id === existingItem.productId);
        if (templateProduct) {
          return {
            ...existingItem,
            stockAdded: templateProduct.stock_added
          };
        }
        return existingItem;
      });

      const newTemplateProducts = template.products.filter((templateProduct: any) => 
        !stockItems.some(item => item.productId === templateProduct.product_id)
      );

      const newStockItems = newTemplateProducts.map((templateProduct: any) => {
        const product = productsData?.find(p => p.id === templateProduct.product_id);
        if (!product) return null;

        return {
          productId: product.id,
          productName: product.name,
          category: product.category,
          openingStock: 0,
          actualStock: 0,
          availableStock: 0,
          stockAdded: templateProduct.stock_added,
        };
      }).filter(Boolean);

      setStockItems([...updatedStockItems, ...newStockItems]);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  const clearAllStockAdditions = () => {
    setStockItems(prev => prev.map(item => ({ ...item, stockAdded: 0 })));
    toast.success('All stock additions cleared');
  };

  if (!user) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Please log in to access store management.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedProducts = categories.reduce((acc, category) => {
    acc[category] = products.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, Product[]>);

  const totalStockAdded = stockItems.reduce((sum, item) => sum + item.stockAdded, 0);

  return (
    <div className="space-y-4">
      <Card className="border-indigo-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
            <Store className="h-5 w-5" />
            Stock Management
            {stockItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockItems.length} products
              </Badge>
            )}
            {totalStockAdded > 0 && (
              <Badge variant="default" className="ml-2 bg-green-600">
                +{totalStockAdded} items to add
              </Badge>
            )}
            {isAdmin && (
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                Admin
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
            <div>
              <Label htmlFor="date" className="text-sm">Stock Date</Label>
              <Input
                id="date"
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
                className="h-8"
              />
            </div>

            <div>
              <Label htmlFor="shop" className="text-sm">Select Store</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                  {shops.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No shops available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadStoreInventory}
                disabled={!selectedShop}
                variant="outline"
                size="sm"
                className="w-full h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Load Inventory
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setQuickAddMode(!quickAddMode)}
                variant={quickAddMode ? "default" : "outline"}
                size="sm"
                className="w-full h-8"
              >
                <Zap className="h-3 w-3 mr-1" />
                Quick Mode
              </Button>
            </div>
          </div>

          {totalStockAdded > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={clearAllStockAdditions}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Clear All Additions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedShop && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                Add Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {categories.map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-xs text-gray-700 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="grid gap-1">
                      {groupedProducts[category]?.map(product => (
                        <Button
                          key={product.id}
                          variant="outline"
                          className="justify-between h-auto p-2 text-sm"
                          onClick={() => addProductToStore(product)}
                          disabled={stockItems.some(item => item.productId === product.id)}
                        >
                          <div className="text-left">
                            <div className="font-medium text-sm">{product.name}</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">₹{product.price}</Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-3 text-muted-foreground text-sm">
                    No products available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <StockTemplate
            onApplyTemplate={applyTemplate}
            currentShopId={selectedShop}
            currentStockItems={stockItems}
          />

          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package2 className="h-4 w-4" />
                Store Inventory ({stockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stockItems.map(item => (
                  <div key={item.productId} className="p-2 border rounded-lg">
                    <div className="mb-2">
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                    <div className={`grid gap-2 ${quickAddMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {!quickAddMode && (
                        <>
                          <div>
                            <Label htmlFor={`opening-${item.productId}`} className="text-xs flex items-center gap-1">
                              Opening Stock
                              {!isAdmin && <Lock className="h-3 w-3" />}
                            </Label>
                            <Input
                              id={`opening-${item.productId}`}
                              type="number"
                              value={item.openingStock}
                              onChange={(e) => updateStockItem(item.productId, 'openingStock', parseInt(e.target.value) || 0)}
                              className="h-7 text-sm"
                              min="0"
                              disabled={!isAdmin}
                              title={!isAdmin ? "Only admins can edit opening stock" : ""}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`actual-${item.productId}`} className="text-xs">Actual Stock</Label>
                            <Input
                              id={`actual-${item.productId}`}
                              type="number"
                              value={item.actualStock}
                              onChange={(e) => updateStockItem(item.productId, 'actualStock', parseInt(e.target.value) || 0)}
                              className="h-7 text-sm"
                              min="0"
                            />
                          </div>
                        </>
                      )}
                      <div className={quickAddMode ? 'col-span-1' : ''}>
                        <Label htmlFor={`stock-added-${item.productId}`} className="text-xs text-blue-600 font-medium">
                          Stock to Add
                        </Label>
                        <Input
                          id={`stock-added-${item.productId}`}
                          type="number"
                          value={item.stockAdded}
                          onChange={(e) => updateStockItem(item.productId, 'stockAdded', parseInt(e.target.value) || 0)}
                          className="h-7 text-sm border-blue-300 focus:border-blue-500"
                          min="0"
                          placeholder="Add stock"
                        />
                      </div>
                      {!quickAddMode && (
                        <div>
                          <Label htmlFor={`available-${item.productId}`} className="text-xs">Available Stock</Label>
                          <Input
                            id={`available-${item.productId}`}
                            type="number"
                            value={item.availableStock}
                            onChange={(e) => updateStockItem(item.productId, 'availableStock', parseInt(e.target.value) || 0)}
                            className="h-7 text-sm"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {stockItems.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No products in store inventory</p>
                    <p className="text-xs">Add products from the left panel</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
        <Button variant="outline" onClick={onCancel} disabled={loading} size="sm">
          Cancel
        </Button>
        <Button 
          onClick={saveStockData}
          disabled={loading || !selectedShop || stockItems.length === 0}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          {loading ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          Save Store Inventory
        </Button>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Lock className="h-3 w-3" />
            <span className="text-xs font-medium">Note: Opening stock auto-fills from actual stock for non-admin users</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewStockManagement;
