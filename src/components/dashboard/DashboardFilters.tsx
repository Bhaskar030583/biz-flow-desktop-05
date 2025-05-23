
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Store, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface Shop {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface DashboardFiltersProps {
  onFilterChange: (filters: {
    startDate: Date | null;
    endDate: Date | null;
    shopIds: string[];
    category: string | null;
    productId: string | null;
  }) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [showShopDropdown, setShowShopDropdown] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch shops
  useEffect(() => {
    async function fetchShops() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("id, name")
          .order("name");
        
        if (error) throw error;
        setShops(data || []);
      } catch (error: any) {
        console.error("Error fetching shops:", error.message);
      }
    }

    fetchShops();
  }, []);

  // Fetch products and categories
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        
        let query = supabase
          .from("products")
          .select("id, name, category");
        
        // Filter by shop if selected shops
        if (selectedShopIds.length > 0) {
          // This would require a join with sales to filter products by shop
          // For simplicity, we're not doing this filter here
        }
        
        const { data, error } = await query.order("name");
        
        if (error) throw error;
        
        setProducts(data || []);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((data || []).map(product => product.category))
        );
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error("Error fetching products:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedShopIds]);

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  // Apply all filters
  useEffect(() => {
    onFilterChange({
      startDate,
      endDate,
      shopIds: selectedShopIds,
      category: selectedCategory,
      productId: selectedProduct
    });
  }, [startDate, endDate, selectedShopIds, selectedCategory, selectedProduct, onFilterChange]);

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedShopIds([]);
    setSelectedCategory(null);
    setSelectedProduct(null);
  };

  // Toggle shop selection
  const toggleShop = (shopId: string) => {
    setSelectedShopIds(prevSelected => {
      if (prevSelected.includes(shopId)) {
        return prevSelected.filter(id => id !== shopId);
      } else {
        return [...prevSelected, shopId];
      }
    });
  };

  // Toggle all shops
  const toggleAllShops = () => {
    if (selectedShopIds.length === shops.length) {
      setSelectedShopIds([]);
    } else {
      setSelectedShopIds(shops.map(shop => shop.id));
    }
  };

  // Get shop display text
  const getShopDisplayText = () => {
    if (selectedShopIds.length === 0) {
      return "Select Shop(s)";
    } else if (selectedShopIds.length === shops.length) {
      return "All Shops";
    } else if (selectedShopIds.length === 1) {
      const shop = shops.find(s => s.id === selectedShopIds[0]);
      return shop ? shop.name : "1 Shop";
    } else {
      return `${selectedShopIds.length} Shops`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Start Date */}
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Shop Multi-Select */}
      <div>
        <Popover open={showShopDropdown} onOpenChange={setShowShopDropdown}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left font-normal"
            >
              <div className="flex items-center">
                <Store className="w-4 h-4 mr-2" />
                <span className={cn(selectedShopIds.length === 0 && "text-muted-foreground")}>
                  {getShopDisplayText()}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <div className="p-2 border-b border-gray-100">
              <div 
                className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={toggleAllShops}
              >
                <Checkbox 
                  checked={shops.length > 0 && selectedShopIds.length === shops.length}
                  className="border-indigo-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:text-white"
                />
                <label className="text-sm cursor-pointer flex-1">All Shops</label>
              </div>
            </div>
            <div className="py-2 max-h-60 overflow-auto">
              {shops.map((shop) => (
                <div 
                  key={shop.id}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleShop(shop.id)}
                >
                  <Checkbox 
                    checked={selectedShopIds.includes(shop.id)}
                    className="border-indigo-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:text-white"
                  />
                  <label className="text-sm cursor-pointer flex-1">{shop.name}</label>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 p-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowShopDropdown(false)}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Select */}
      <div>
        <Select
          value={selectedCategory || undefined}
          onValueChange={(value) => {
            setSelectedCategory(value || null);
            setSelectedProduct(null); // Reset product when category changes
          }}
        >
          <SelectTrigger className={cn(!selectedCategory && "text-muted-foreground")}>
            <Package className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Select */}
      <div>
        <Select
          value={selectedProduct || undefined}
          onValueChange={(value) => setSelectedProduct(value || null)}
        >
          <SelectTrigger className={cn(!selectedProduct && "text-muted-foreground")}>
            <Package className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {filteredProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Filters Button - Additional to the grid */}
      <Button 
        variant="outline" 
        onClick={resetFilters}
        className="mt-2 lg:mt-0 col-span-1 md:col-span-2 lg:col-span-5 bg-white hover:bg-gray-50"
      >
        Reset Filters
      </Button>
    </div>
  );
}
