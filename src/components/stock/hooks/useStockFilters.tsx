
import { useState, useMemo } from "react";
import { AssignedProduct } from "./useAssignedProducts";

export const useStockFilters = (assignedProducts: AssignedProduct[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");

  const filteredProducts = useMemo(() => {
    console.log('🔍 [useStockFilters] Filtering products with:', {
      totalProducts: assignedProducts.length,
      searchTerm,
      shopFilter,
      productFilter
    });

    return assignedProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by shop - since we're already filtering at the data level, this is redundant but kept for consistency
      const matchesShop = shopFilter === "_all" || product.shop_id === shopFilter;
      const matchesProduct = productFilter === "_all" || product.id === productFilter;
      
      const shouldInclude = matchesSearch && matchesShop && matchesProduct;
      
      console.log('🔍 [useStockFilters] Product filter result:', {
        productName: product.name,
        shopName: product.shop_name,
        shopId: product.shop_id,
        matchesSearch,
        matchesShop,
        matchesProduct,
        shouldInclude
      });
      
      return shouldInclude;
    });
  }, [assignedProducts, searchTerm, shopFilter, productFilter]);

  console.log('🔍 [useStockFilters] Final filtered results:', {
    originalCount: assignedProducts.length,
    filteredCount: filteredProducts.length
  });

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
