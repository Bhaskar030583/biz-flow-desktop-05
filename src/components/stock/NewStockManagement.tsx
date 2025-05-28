
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import QuickStockActions from "./QuickStockActions";
import StockManagementHeader from "./StockManagementHeader";
import StockInventoryDisplay from "./StockInventoryDisplay";
import StockManagementActions from "./StockManagementActions";
import StockManagementNote from "./StockManagementNote";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Shop {
  id: string;
  name: string;
  store_code?: string;
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
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);

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
      fetchAssignedProducts();
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
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      if (error) throw error;
      
      const transformedStores = data?.map(store => ({
        id: store.id,
        name: store.store_name,
        store_code: store.store_code
      })) || [];
      
      setShops(transformedStores);
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

  const fetchAssignedProducts = async () => {
    if (!selectedShop) return;
    
    try {
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          products (id, name, price, category)
        `)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);

      if (error) throw error;

      const assignedProductsData = data?.map(item => item.products).filter(Boolean) || [];
      setAssignedProducts(assignedProductsData);
    } catch (error) {
      console.error('Error fetching assigned products:', error);
      toast.error('Failed to fetch assigned products');
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

      const { data: assignedData, error: assignedError } = await supabase
        .from('product_shops')
        .select(`
          products (id, name, category)
        `)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);

      if (assignedError) throw assignedError;

      const assignedProductsForStore = assignedData?.map(item => item.products).filter(Boolean) || [];

      const newStockItems: StockItem[] = assignedProductsForStore.map(product => {
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

  const handleBulkAdd = (amount: number) => {
    if (stockItems.length === 0) {
      toast.error('No products in store inventory. Add products first.');
      return;
    }
    
    setStockItems(prev => 
      prev.map(item => ({
        ...item,
        stockAdded: item.stockAdded + amount,
        availableStock: item.availableStock + amount
      }))
    );
    toast.success(`Added ${amount} to all products`);
  };

  const clearAllStockAdditions = () => {
    setStockItems(prev => 
      prev.map(item => ({ 
        ...item, 
        stockAdded: 0,
        availableStock: item.availableStock - item.stockAdded
      }))
    );
    toast.success('All stock additions cleared');
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

  if (!user) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Please log in to access store management.</p>
        </CardContent>
      </Card>
    );
  }

  const totalStockAdded = stockItems.reduce((sum, item) => sum + item.stockAdded, 0);

  return (
    <div className="space-y-4">
      <StockManagementHeader
        stockDate={stockDate}
        setStockDate={setStockDate}
        selectedShop={selectedShop}
        setSelectedShop={setSelectedShop}
        shops={shops}
        stockItemsCount={stockItems.length}
        isAdmin={isAdmin}
        onLoadInventory={loadStoreInventory}
      />

      {selectedShop && (
        <QuickStockActions
          quickAddMode={quickAddMode}
          setQuickAddMode={setQuickAddMode}
          totalStockAdded={totalStockAdded}
          onClearAllAdditions={clearAllStockAdditions}
          onBulkAdd={handleBulkAdd}
          hasStockItems={stockItems.length > 0}
        />
      )}

      {selectedShop && (
        <StockInventoryDisplay
          stockItems={stockItems}
          totalStockAdded={totalStockAdded}
          quickAddMode={quickAddMode}
          isAdmin={isAdmin}
          onUpdateStock={updateStockItem}
        />
      )}

      <StockManagementActions
        loading={loading}
        selectedShop={selectedShop}
        stockItemsCount={stockItems.length}
        onSave={saveStockData}
        onCancel={onCancel}
      />

      <StockManagementNote isAdmin={isAdmin} />
    </div>
  );
};

export default NewStockManagement;
