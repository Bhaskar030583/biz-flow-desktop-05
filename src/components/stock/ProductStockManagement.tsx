
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ProductStockHeader from "./ProductStockHeader";
import ProductAssignmentForm from "./ProductAssignmentForm";
import ProductStockTable from "./ProductStockTable";
import StockEditDialog from "./StockEditDialog";

interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
}

interface ProductStockManagementProps {
  onStockUpdated: () => void;
  refreshTrigger?: number;
}

const ProductStockManagement = ({ onStockUpdated, refreshTrigger }: ProductStockManagementProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<AssignedProduct | null>(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [addStockQuantities, setAddStockQuantities] = useState<Record<string, string>>({});
  const [updatingStock, setUpdatingStock] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Query for shops
  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Query for assigned products with stock data
  const { data: assignedProducts, isLoading, refetch } = useQuery({
    queryKey: ['product-stock-management', selectedShopId, refreshTrigger],
    queryFn: async () => {
      if (!selectedShopId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: productShops, error: productShopsError } = await supabase
        .from('product_shops')
        .select(`
          id,
          products (
            id,
            name,
            category,
            price,
            cost_price
          )
        `)
        .eq('shop_id', selectedShopId)
        .eq('user_id', user?.id);
      
      if (productShopsError) throw productShopsError;
      
      if (!productShops || productShops.length === 0) return [];
      
      const productsWithStock = await Promise.all(
        productShops.map(async (item) => {
          if (!item.products) return null;
          
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('product_id', item.products.id)
            .eq('shop_id', selectedShopId)
            .eq('user_id', user?.id)
            .eq('stock_date', today)
            .maybeSingle();
          
          if (stockError) {
            console.error('Error fetching stock for product:', item.products.id, stockError);
          }
          
          const sold_quantity = stockData ? 
            (stockData.opening_stock + (stockData.stock_added || 0)) - stockData.actual_stock : 0;
          
          return {
            assignment_id: item.id,
            id: item.products.id,
            name: item.products.name,
            category: item.products.category,
            price: item.products.price,
            cost_price: item.products.cost_price,
            opening_stock: stockData?.opening_stock || 0,
            stock_added: stockData?.stock_added || 0,
            closing_stock: stockData?.closing_stock || 0,
            actual_stock: stockData?.actual_stock || 0,
            last_stock_date: stockData?.stock_date || null,
            sold_quantity
          };
        })
      );
      
      return productsWithStock.filter(product => product !== null) as AssignedProduct[];
    },
    enabled: !!selectedShopId && !!user?.id
  });

  // Filter products based on search and category
  const filteredProducts = assignedProducts?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories for filter
  const categories = Array.from(new Set(assignedProducts?.map(product => product.category) || []));

  const handleAddStock = async (productId: string) => {
    const quantity = addStockQuantities[productId];
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    setUpdatingStock(prev => ({ ...prev, [productId]: true }));

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if stock entry exists for today
      const { data: existingStock, error: fetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', productId)
        .eq('shop_id', selectedShopId)
        .eq('stock_date', today)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing stock:', fetchError);
        toast.error(`Failed to add stock for ${filteredProducts.find(p => p.id === productId)?.name}`);
        return;
      }

      const stockToAdd = Number(quantity);

      if (existingStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            closing_stock: existingStock.closing_stock + stockToAdd,
            actual_stock: existingStock.actual_stock + stockToAdd,
            stock_added: (existingStock.stock_added || 0) + stockToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock.id);

        if (updateError) {
          console.error('Error updating stock:', updateError);
          toast.error(`Failed to add stock for ${filteredProducts.find(p => p.id === productId)?.name}`);
        }
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: productId,
            shop_id: selectedShopId,
            stock_date: today,
            opening_stock: 0,
            closing_stock: stockToAdd,
            actual_stock: stockToAdd,
            stock_added: stockToAdd,
            user_id: user.id
          });

        if (insertError) {
          console.error('Error creating stock entry:', insertError);
          toast.error(`Failed to create stock entry for ${filteredProducts.find(p => p.id === productId)?.name}`);
        }
      }

      // Invalidate related queries to trigger refetch across the app
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });

      toast.success(`Added ${quantity} stock for ${filteredProducts.find(p => p.id === productId)?.name}`);
      setAddStockQuantities(prev => {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      });
      onStockUpdated();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleEditStock = (product: AssignedProduct) => {
    console.log('=== HANDLE EDIT STOCK ===');
    console.log('Product received:', product);
    setEditingProduct(product);
  };

  const handleRemoveProduct = async (assignmentId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to deassign "${productName}" from this store? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('product_shops')
        .delete()
        .eq('id', assignmentId);
        
      if (error) {
        console.error("Error deassigning product:", error);
        toast.error(`Failed to deassign product: ${productName}`);
        return;
      }
      
      // Invalidate related queries to trigger refetch across the app
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      
      toast.success(`Product "${productName}" deassigned successfully.`);
      onStockUpdated();
    } catch (error) {
      console.error("Error deassigning product:", error);
      toast.error(`Failed to deassign product: ${productName}`);
    }
  };

  const handleDeleteStock = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete all stock entries for "${productName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('product_id', productId)
        .eq('shop_id', selectedShopId);
      
      if (error) {
        console.error("Error deleting stock:", error);
        toast.error(`Failed to delete stock for product: ${productName}`);
        return;
      }
      
      // Invalidate related queries to trigger refetch across the app
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-management'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      
      toast.success(`Stock entries for product "${productName}" deleted successfully.`);
      onStockUpdated();
    } catch (error) {
      console.error("Error deleting stock:", error);
      toast.error(`Failed to delete stock for product: ${productName}`);
    }
  };

  const handleProductAssigned = () => {
    refetch();
    onStockUpdated();
    setShowAssignmentForm(false);
  };

  const handleStockEditComplete = () => {
    setEditingProduct(null);
    refetch();
    onStockUpdated();
  };

  return (
    <div className="space-y-6">
      <ProductStockHeader
        selectedShop={selectedShopId}
        setSelectedShop={setSelectedShopId}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        showAssignmentForm={showAssignmentForm}
        setShowAssignmentForm={setShowAssignmentForm}
        shops={shops || []}
        shopsLoading={shopsLoading}
        categories={categories}
        productCount={filteredProducts.length}
      />

      {selectedShopId && (
        <>
          {showAssignmentForm && (
            <ProductAssignmentForm
              selectedShop={selectedShopId}
              onProductAssigned={handleProductAssigned}
              onCancel={() => setShowAssignmentForm(false)}
            />
          )}

          <ProductStockTable
            filteredProducts={filteredProducts}
            isAdmin={isAdmin}
            addStockQuantities={addStockQuantities}
            setAddStockQuantities={setAddStockQuantities}
            updatingStock={updatingStock}
            onAddStock={handleAddStock}
            onEditStock={handleEditStock}
            onRemoveProduct={handleRemoveProduct}
            onDeleteStock={handleDeleteStock}
          />
        </>
      )}

      {editingProduct && (
        <StockEditDialog
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          editStockValues={{
            stock_added: editingProduct.stock_added || 0,
            actual_stock: editingProduct.actual_stock || 0
          }}
          setEditStockValues={() => {}}
          selectedShop={selectedShopId}
          shops={shops || []}
          onUpdateStock={handleStockEditComplete}
          isUpdatingStock={false}
        />
      )}
    </div>
  );
};

export default ProductStockManagement;
