
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Store, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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
    shopId: string | null;
    category: string | null;
    productId: string | null;
  }) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
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
        
        // Filter by shop if selected
        if (selectedShop) {
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
  }, [selectedShop]);

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  // Apply all filters
  useEffect(() => {
    onFilterChange({
      startDate,
      endDate,
      shopId: selectedShop,
      category: selectedCategory,
      productId: selectedProduct
    });
  }, [startDate, endDate, selectedShop, selectedCategory, selectedProduct, onFilterChange]);

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedShop(null);
    setSelectedCategory(null);
    setSelectedProduct(null);
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

      {/* Shop Select */}
      <div>
        <Select
          value={selectedShop || ""}
          onValueChange={(value) => setSelectedShop(value || null)}
        >
          <SelectTrigger className={cn(!selectedShop && "text-muted-foreground")}>
            <Store className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Shop" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Shops</SelectItem>
            {shops.map((shop) => (
              <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Select */}
      <div>
        <Select
          value={selectedCategory || ""}
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
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Select */}
      <div>
        <Select
          value={selectedProduct || ""}
          onValueChange={(value) => setSelectedProduct(value || null)}
        >
          <SelectTrigger className={cn(!selectedProduct && "text-muted-foreground")}>
            <Package className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Products</SelectItem>
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
        className="mt-2 lg:mt-0 col-span-1 md:col-span-2 lg:col-span-5"
      >
        Reset Filters
      </Button>
    </div>
  );
}
