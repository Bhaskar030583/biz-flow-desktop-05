
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
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Now we can properly filter by shop since we have shop_id in the product data
      const matchesShop = shopFilter === "_all" || product.shop_id === shopFilter;
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
