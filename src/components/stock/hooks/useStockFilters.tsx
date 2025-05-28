import { useState, useMemo } from "react";
import { AssignedProduct } from "./useAssignedProducts";

export const useStockFilters = (assignedProducts: AssignedProduct[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");

  const filteredProducts = useMemo(() => {
    return assignedProducts.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Since we're getting data from product_shops table, we need to filter by assignment_id
      // For now, we'll keep the shop filter but it won't filter by specific shops
      // as the current data structure doesn't include shop information per product
      const matchesShop = shopFilter === "_all"; // Always true for now since we don't have shop info per product
      const matchesProduct = productFilter === "_all" || product.id === productFilter;
      
      return matchesSearch && matchesShop && matchesProduct;
    });
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
