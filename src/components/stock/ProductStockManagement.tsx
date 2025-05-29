
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import ProductStockHeader from "./ProductStockHeader";
import ProductAssignmentForm from "./ProductAssignmentForm";
import StockRealtimeView from "./StockRealtimeView";
import AssignedProductsList from "./AssignedProductsList";

interface ProductStockManagementProps {
  onStockUpdated?: () => void;
  refreshTrigger?: number;
}

const ProductStockManagement = ({ 
  onStockUpdated, 
  refreshTrigger 
}: ProductStockManagementProps) => {
  const { user } = useAuth();
  const [selectedShop, setSelectedShop] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // Fetch HRMS stores instead of shops
  const { data: storesData, isLoading: shopsLoading } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      if (error) throw error;
      return data || [];
    }
  });

  // Transform hr_stores data to match the Shop interface
  const shops = storesData?.map(store => ({
    id: store.id,
    name: store.store_name,
    store_code: store.store_code
  })) || [];

  // Auto-select first shop when shops are loaded
  useEffect(() => {
    if (shops && shops.length > 0 && !selectedShop) {
      setSelectedShop(shops[0].id);
    }
  }, [shops, selectedShop]);

  // Fetch assigned products for selected shop
  const { data: assignedProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['assigned-products', selectedShop, refreshTrigger],
    queryFn: async () => {
      if (!selectedShop) return [];
      
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          product_id,
          products (
            id,
            name,
            category,
            price,
            cost_price
          )
        `)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data?.map(ps => ps.products).filter(Boolean) || [];
    },
    enabled: !!selectedShop && !!user?.id
  });

  // Get unique categories from assigned products
  const categories = [...new Set(assignedProducts?.map(product => product.category) || [])];

  const handleProductAssigned = () => {
    refetchProducts();
    setShowAssignmentForm(false);
    if (onStockUpdated) {
      onStockUpdated();
    }
  };

  const handleProductDeassigned = () => {
    refetchProducts();
    if (onStockUpdated) {
      onStockUpdated();
    }
  };

  const productCount = assignedProducts?.length || 0;

  return (
    <Card className="w-full">
      <ProductStockHeader
        selectedShop={selectedShop}
        setSelectedShop={setSelectedShop}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        showAssignmentForm={showAssignmentForm}
        setShowAssignmentForm={setShowAssignmentForm}
        shops={shops}
        shopsLoading={shopsLoading}
        categories={categories}
        productCount={productCount}
      />

      <CardContent className="space-y-6">
        {showAssignmentForm && selectedShop && (
          <ProductAssignmentForm
            selectedShop={selectedShop}
            onProductAssigned={handleProductAssigned}
            onCancel={() => setShowAssignmentForm(false)}
          />
        )}

        <AssignedProductsList
          assignedProducts={assignedProducts || []}
          selectedShop={selectedShop}
          onProductDeassigned={handleProductDeassigned}
        />

        <StockRealtimeView selectedShop={selectedShop} />
      </CardContent>
    </Card>
  );
};

export default ProductStockManagement;
