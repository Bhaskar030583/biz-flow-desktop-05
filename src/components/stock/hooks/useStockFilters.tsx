
import { useState, useMemo } from "react";
import { AssignedProduct } from "./useAssignedProducts";

export const useStockFilters = (assignedProducts: AssignedProduct[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");

  const filteredProducts = useMemo(() => {
    console.log('🔍 [useStockFilters] Starting filter process:', {
      totalProducts: assignedProducts.length,
      searchTerm,
      shopFilter,
      productFilter
    });

    if (!assignedProducts || assignedProducts.length === 0) {
      console.log('🔍 [useStockFilters] No products to filter');
      return [];
    }

    // If "All Stores" is selected, return all products
    if (shopFilter === "_all") {
      console.log('🔍 [useStockFilters] Showing all stores - returning all products:', assignedProducts.length);
      
      // Still apply search and product filters
      const filtered = assignedProducts.filter(product => {
        const matchesSearch = !searchTerm || 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesProduct = productFilter === "_all" || product.id === productFilter;
        
        return matchesSearch && matchesProduct;
      });
      
      console.log('🔍 [useStockFilters] After search/product filter:', filtered.length);
      return filtered;
    }

    // Filter by specific shop
    const filtered = assignedProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesShop = product.shop_id === shopFilter;
      const matchesProduct = productFilter === "_all" || product.id === productFilter;
      
      return matchesSearch && matchesShop && matchesProduct;
    });

    console.log('🔍 [useStockFilters] Final filtered results:', filtered.length);
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
