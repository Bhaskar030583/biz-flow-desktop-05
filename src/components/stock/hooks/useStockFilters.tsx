
import { useState, useMemo } from "react";
import { AssignedProduct } from "./useAssignedProducts";

export const useStockFilters = (assignedProducts: AssignedProduct[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");

  const filteredProducts = useMemo(() => {
    console.log('🔍 [useStockFilters] Starting filter with:', {
      totalProducts: assignedProducts.length,
      searchTerm,
      shopFilter,
      productFilter
    });

    const filtered = assignedProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by shop - this is where the main filtering happens
      const matchesShop = shopFilter === "_all" || product.shop_id === shopFilter;
      const matchesProduct = productFilter === "_all" || product.id === productFilter;
      
      const shouldInclude = matchesSearch && matchesShop && matchesProduct;
      
      if (!shouldInclude) {
        console.log('🔍 [useStockFilters] Filtering out:', {
          productName: product.name,
          shopName: product.shop_name,
          shopId: product.shop_id,
          selectedShop: shopFilter,
          matchesSearch,
          matchesShop,
          matchesProduct
        });
      }
      
      return shouldInclude;
    });

    console.log('🔍 [useStockFilters] Filter results:', {
      originalCount: assignedProducts.length,
      filteredCount: filtered.length,
      shopFilter,
      availableShops: [...new Set(assignedProducts.map(p => `${p.shop_id}:${p.shop_name}`))],
    });

    return filtered;
  }, [assignedProducts, searchTerm, shopFilter, productFilter]);

  return {
    searchTerm,
    setSearchTerm,
    shopFilter,
    setShopFilter,
    productFilter,
    setProductFilter,
    paymentModeFilter,
    setPaymentModeFilter,
    filteredProducts
  };
};
