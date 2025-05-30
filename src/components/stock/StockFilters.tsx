
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useStockQueries";

interface StockFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  shopFilter: string;
  setShopFilter: (value: string) => void;
  productFilter: string;
  setProductFilter: (value: string) => void;
  shops: { id: string; name: string }[];
  products: { id: string; name: string }[];
  paymentModeFilter?: string;
  setPaymentModeFilter?: (value: string) => void;
}

const StockFilters = ({
  searchTerm,
  setSearchTerm,
  shopFilter,
  setShopFilter,
  productFilter,
  setProductFilter,
  shops,
  products,
  paymentModeFilter,
  setPaymentModeFilter,
}: StockFiltersProps) => {
  const [inputValue, setInputValue] = useState(searchTerm);
  const debouncedSearchTerm = useDebounce(inputValue);
  
  // Update the actual search term when the debounced value changes
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClearSearch = () => {
    setInputValue("");
  };

  // Enhanced validation with stricter checks
  const isValidItem = (item: any): item is { id: string; name: string } => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      item.id.trim().length > 0 &&
      item.name.trim().length > 0 &&
      item.id !== "null" &&
      item.id !== "undefined" &&
      item.name !== "null" &&
      item.name !== "undefined"
    );
  };

  const validStores = Array.isArray(shops) ? shops.filter(isValidItem) : [];
  const validProducts = Array.isArray(products) ? products.filter(isValidItem) : [];

  const hasFilters = 
    searchTerm !== "" || 
    (shopFilter !== "" && shopFilter !== "_all") || 
    (productFilter !== "" && productFilter !== "_all") ||
    (paymentModeFilter && paymentModeFilter !== "" && paymentModeFilter !== "_all");

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search stocks..." 
            className="pl-9 w-full"
            value={inputValue}
            onChange={handleInputChange}
          />
          {inputValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-1 gap-2">
          <Select value={shopFilter || "_all"} onValueChange={setShopFilter}>
            <SelectTrigger className="w-full min-w-[120px]">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="_all">All Stores</SelectItem>
              {validStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
              {validStores.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No stores available
                </div>
              )}
            </SelectContent>
          </Select>

          <Select value={productFilter || "_all"} onValueChange={setProductFilter}>
            <SelectTrigger className="w-full min-w-[120px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="_all">All Products</SelectItem>
              {validProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
              {validProducts.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No products available
                </div>
              )}
            </SelectContent>
          </Select>

          {setPaymentModeFilter && (
            <Select value={paymentModeFilter || "_all"} onValueChange={setPaymentModeFilter}>
              <SelectTrigger className="w-full min-w-[130px]">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="_all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setInputValue("");
              setShopFilter("_all");
              setProductFilter("_all");
              if (setPaymentModeFilter) {
                setPaymentModeFilter("_all");
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(StockFilters);
