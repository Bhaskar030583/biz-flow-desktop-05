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
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState(false);

  useEffect(() => {
    console.log('=== COMPONENT MOUNTED ===');
    if (user) {
      console.log('User found:', user.id);
      fetchShops();
      checkUserRole();
    } else {
      console.log('No user found');
    }
  }, [user]);

  useEffect(() => {
    console.log('=== SELECTED SHOP OR DATE CHANGED ===');
    console.log('Selected Shop:', selectedShop);
    console.log('Stock Date:', stockDate);
    if (selectedShop) {
      loadStoreInventory();
      fetchAssignedProducts();
    }
  }, [selectedShop, stockDate]);

  const checkUserRole = async () => {
    try {
      console.log('=== CHECKING USER ROLE ===');
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking user role:', error.message || error);
        return;
      }
      
      console.log('User role:', data?.role);
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error in checkUserRole:', error);
    }
  };

  const fetchShops = async () => {
    try {
      console.log('=== FETCHING SHOPS ===');
      if (!user?.id) {
        console.log('No user ID available for fetching shops');
        return;
      }

      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      if (error) {
        console.error('Error fetching shops:', error.message || error);
        toast.error('Failed to fetch shops');
        return;
      }
      
      console.log('Fetched shops:', data);
      const transformedStores = data?.map(store => ({
        id: store.id,
        name: store.store_name,
        store_code: store.store_code
      })) || [];
      
      console.log('Transformed stores:', transformedStores);
      setShops(transformedStores);
      
      // Auto-select first shop if none selected
      if (transformedStores.length > 0 && !selectedShop) {
        console.log('Auto-selecting first shop:', transformedStores[0].id);
        setSelectedShop(transformedStores[0].id);
      }
    } catch (error) {
      console.error('Error in fetchShops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const fetchAssignedProducts = async () => {
    if (!selectedShop || !user?.id) {
      console.log('=== NO SHOP SELECTED OR USER, SKIPPING PRODUCT FETCH ===');
      setAssignedProducts([]);
      return;
    }
    
    try {
      console.log('=== FETCHING ASSIGNED PRODUCTS ===');
      console.log('Shop ID:', selectedShop);
      console.log('User ID:', user.id);
      
      // Check if we have any product assignments for this user
      const { data: userShops, error: userShopsError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user.id);
      
      console.log('User shops from shops table:', { userShops, userShopsError });
      
      if (userShopsError) {
        console.error('Error fetching user shops:', userShopsError.message || userShopsError);
        toast.error('Failed to fetch user shops');
        setAssignedProducts([]);
        return;
      }

      if (!userShops || userShops.length === 0) {
        console.log('No shops found for user in shops table');
        toast.info('No shops found. Please create a shop first.');
        setAssignedProducts([]);
        return;
      }

      // Use the first shop from user's shops for product assignment lookup
      const shopId = userShops[0].id;
      console.log('Using shop ID for product lookup:', shopId);
      
      const { data: productAssignments, error: assignmentError } = await supabase
        .from('product_shops')
        .select(`
          products (id, name, price, category)
        `)
        .eq('shop_id', shopId)
        .eq('user_id', user.id);
      
      console.log('Product assignment query result:', { productAssignments, assignmentError });
      
      if (assignmentError) {
        console.error('Error fetching assigned products:', assignmentError.message || assignmentError);
        toast.error('Failed to fetch assigned products');
        setAssignedProducts([]);
        return;
      }

      const assignedProductsData = productAssignments?.map(item => item.products).filter(Boolean) || [];
      console.log('Assigned products:', assignedProductsData);
      setAssignedProducts(assignedProductsData);
      
      if (assignedProductsData.length === 0) {
        console.log('No products assigned to any store for this user');
        toast.info('No products assigned. Please assign products to a store first.');
      }
    } catch (error) {
      console.error('Error in fetchAssignedProducts:', error);
      toast.error('Failed to fetch assigned products');
      setAssignedProducts([]);
    }
  };

  const loadStoreInventory = async () => {
    if (!selectedShop || !user?.id) {
      console.log('=== NO SHOP SELECTED OR USER, SKIPPING INVENTORY LOAD ===');
      return;
    }
    
    try {
      console.log('=== LOADING STORE INVENTORY ===');
      console.log('Shop ID:', selectedShop);
      console.log('Stock Date:', stockDate);
      console.log('User ID:', user.id);
      
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
        .eq('stock_date', stockDate)
        .eq('user_id', user.id);

      console.log('Stock data query result:', { stockData, error });

      if (error) {
        console.error('Error loading store inventory:', error.message || error);
      }

      const previousDay = new Date(stockDate);
      previousDay.setDate(previousDay.getDate() - 1);
      const previousDate = format(previousDay, 'yyyy-MM-dd');

      console.log('Fetching previous day stock for:', previousDate);

      const { data: previousStockData, error: prevError } = await supabase
        .from('stocks')
        .select('product_id, actual_stock')
        .eq('shop_id', selectedShop)
        .eq('stock_date', previousDate)
        .eq('user_id', user.id);

      console.log('Previous stock data:', { previousStockData, prevError });

      if (prevError) {
        console.error('Error fetching previous stock:', prevError.message || prevError);
      }
    } catch (error) {
      console.error('Error in loadStoreInventory:', error);
      toast.error('Failed to load store inventory');
    }
  };

  // New useEffect to create stock items when assigned products are available
  useEffect(() => {
    if (assignedProducts.length > 0 && selectedShop) {
      console.log('=== CREATING STOCK ITEMS FROM ASSIGNED PRODUCTS ===');
      console.log('Assigned products:', assignedProducts);
      
      const createStockItems = async () => {
        try {
          // Fetch current stock data for assigned products
          const productIds = assignedProducts.map(p => p.id);
          console.log('Product IDs:', productIds);
          
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('product_id, opening_stock, actual_stock, closing_stock, stock_added')
            .eq('shop_id', selectedShop)
            .eq('stock_date', stockDate)
            .eq('user_id', user?.id)
            .in('product_id', productIds);
          
          console.log('Current stock data:', { stockData, stockError });
          
          // Fetch previous day stock
          const previousDay = new Date(stockDate);
          previousDay.setDate(previousDay.getDate() - 1);
          const previousDate = format(previousDay, 'yyyy-MM-dd');
          
          const { data: previousStockData, error: prevError } = await supabase
            .from('stocks')
            .select('product_id, actual_stock')
            .eq('shop_id', selectedShop)
            .eq('stock_date', previousDate)
            .eq('user_id', user?.id)
            .in('product_id', productIds);
          
          console.log('Previous stock data:', { previousStockData, prevError });
          
          const newStockItems: StockItem[] = assignedProducts.map(product => {
            const existingStock = stockData?.find(stock => stock.product_id === product.id);
            const previousStock = previousStockData?.find(stock => stock.product_id === product.id);
            
            const stockItem = {
              productId: product.id,
              productName: product.name,
              category: product.category,
              openingStock: existingStock?.opening_stock || previousStock?.actual_stock || 0,
              actualStock: existingStock?.actual_stock || 0,
              availableStock: existingStock?.closing_stock || 0,
              stockAdded: existingStock?.stock_added || 0,
            };
            
            console.log(`Stock item for ${product.name}:`, stockItem);
            return stockItem;
          });

          console.log('Final stock items:', newStockItems);
          setStockItems(newStockItems);
          
          if (newStockItems.length > 0) {
            toast.success(`Loaded ${newStockItems.length} products for the selected store`);
          }
        } catch (error) {
          console.error('Error creating stock items:', error);
          toast.error('Failed to load product stock data');
        }
      };
      
      createStockItems();
    } else {
      console.log('=== NO ASSIGNED PRODUCTS OR SHOP, CLEARING STOCK ITEMS ===');
      setStockItems([]);
    }
  }, [assignedProducts, selectedShop, stockDate, user?.id]);

  const updateStockItem = (productId: string, field: keyof StockItem, value: number) => {
    console.log('=== UPDATING STOCK ITEM ===');
    console.log('Product ID:', productId);
    console.log('Field:', field);
    console.log('Value:', value);
    
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
          
          console.log('Updated item:', updatedItem);
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
      console.log('=== SAVING STOCK DATA ===');
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

      console.log('Stock data to save:', stockData);

      const { error } = await supabase
        .from('stocks')
        .upsert(stockData, {
          onConflict: 'stock_date,product_id,shop_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error saving stock data:', error.message || error);
        throw error;
      }

      console.log('Stock data saved successfully');
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

  console.log('=== RENDER ===');
  console.log('Stock items count:', stockItems.length);
  console.log('Assigned products count:', assignedProducts.length);
  console.log('Selected shop:', selectedShop);

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
