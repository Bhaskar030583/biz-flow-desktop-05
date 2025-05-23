
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Shop {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface StockFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  shopFilter: string;
  setShopFilter: (filter: string) => void;
  productFilter: string;
  setProductFilter: (filter: string) => void;
  shops: Shop[];
  products: Product[];
}

const StockFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  shopFilter, 
  setShopFilter, 
  productFilter, 
  setProductFilter,
  shops,
  products 
}: StockFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:max-w-[240px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stocks..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <div className="p-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Shop</p>
              <Select value={shopFilter} onValueChange={setShopFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">Product</p>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StockFilters;
