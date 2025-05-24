
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

  // Filter out shops and products with empty IDs
  const validShops = shops.filter(shop => shop.id && shop.id.trim() !== "");
  const validProducts = products.filter(product => product.id && product.id.trim() !== "");

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
              <SelectValue placeholder="All Shops" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="_all">All Shops</SelectItem>
              {validShops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={productFilter || "_all"} onValueChange={setProductFilter}>
            <SelectTrigger className="w-full min-w-[120px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="_all">All Products</SelectItem>
              {validProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {setPaymentModeFilter && (
            <Select value={paymentModeFilter || "_all"} onValueChange={setPaymentModeFilter}>
              <SelectTrigger className="w-full min-w-[130px]">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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
