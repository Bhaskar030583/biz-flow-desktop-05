
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
      productFilter,
      allProducts: assignedProducts.map(p => ({
        name: p.name,
        shopId: p.shop_id,
        shopName: p.shop_name
      }))
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
      console.log('🔍 [useStockFilters] Checking product:', {
        productName: product.name,
        productShopId: product.shop_id,
        productShopName: product.shop_name,
        selectedShopFilter: shopFilter,
        shopIdMatch: product.shop_id === shopFilter,
        shopIdType: typeof product.shop_id,
        filterType: typeof shopFilter
      });

      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // This is the key fix - ensure exact string match for shop_id
      const matchesShop = product.shop_id === shopFilter;
      const matchesProduct = productFilter === "_all" || product.id === productFilter;
      
      const shouldInclude = matchesSearch && matchesShop && matchesProduct;
      
      console.log('🔍 [useStockFilters] Product filter result:', {
        productName: product.name,
        matchesSearch,
        matchesShop,
        matchesProduct,
        shouldInclude
      });
      
      return shouldInclude;
    });

    console.log('🔍 [useStockFilters] Final filtered results:', {
      originalCount: assignedProducts.length,
      filteredCount: filtered.length,
      shopFilter,
      filteredProducts: filtered.map(p => ({ name: p.name, shopName: p.shop_name }))
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
