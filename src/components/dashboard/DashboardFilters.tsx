
import React, { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface DashboardFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedShops: string[];
  setSelectedShops: (shops: string[]) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedProduct: string | null;
  setSelectedProduct: (product: string | null) => void;
}

export function DashboardFilters({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedShops,
  setSelectedShops,
  selectedCategory,
  setSelectedCategory,
  selectedProduct,
  setSelectedProduct
}: DashboardFiltersProps) {
  const { user } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch shops, categories, and products on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchFilterData = async () => {
      setIsLoading(true);
      try {
        // Fetch shops
        const { data: shopsData } = await supabase
          .from("shops")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name");
        
        setShops(shopsData || []);
        
        // Fetch categories
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, category")
          .eq("user_id", user.id)
          .order("name");
        
        const uniqueCategories = Array.from(
          new Set((productsData || []).map(product => product.category))
        ).map(category => ({
          name: category
        }));
        
        setCategories(uniqueCategories);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilterData();
  }, [user]);

  const handleShopChange = (shopId: string) => {
    // If already selected, remove it, otherwise add it
    if (selectedShops.includes(shopId)) {
      setSelectedShops(selectedShops.filter(id => id !== shopId));
    } else {
      setSelectedShops([...selectedShops, shopId]);
    }
  };
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Shop Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Shop</label>
            <Select
              value={selectedShops.length === 1 ? selectedShops[0] : ""}
              onValueChange={(value) => {
                setSelectedShops(value ? [value] : []);
              }}
            >
              <SelectTrigger>
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

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={selectedCategory || ""}
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <Select
              value={selectedProduct || ""}
              onValueChange={(value) => setSelectedProduct(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Products</SelectItem>
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
