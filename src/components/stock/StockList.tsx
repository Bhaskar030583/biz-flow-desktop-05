
import React, { useState } from "react";
import { useAssignedProducts } from "./hooks/useAssignedProducts";
import { useStockFilters } from "./hooks/useStockFilters";
import StockListContent from "./StockListContent";
import StockListSkeleton from "./StockListSkeleton";

interface StockListProps {
  refreshTrigger: number;
}

const StockList = ({ refreshTrigger }: StockListProps) => {
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  const { assignedProducts, loading, shops, products } = useAssignedProducts(
    refreshTrigger + localRefreshTrigger
  );

  const {
    searchTerm,
    setSearchTerm,
    shopFilter,
    setShopFilter,
    productFilter,
    setProductFilter,
    paymentModeFilter,
    setPaymentModeFilter,
    filteredProducts
  } = useStockFilters(assignedProducts);

  console.log('StockList Debug:', {
    assignedProducts: assignedProducts.length,
    shops: shops.length,
    products: products.length,
    loading
  });

  if (loading) {
    return <StockListSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <StockListContent
        assignedProducts={assignedProducts}
        filteredProducts={filteredProducts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        shopFilter={shopFilter}
        setShopFilter={setShopFilter}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        paymentModeFilter={paymentModeFilter}
        setPaymentModeFilter={setPaymentModeFilter}
        shops={shops}
        products={products}
      />
    </div>
  );
};

export default StockList;
