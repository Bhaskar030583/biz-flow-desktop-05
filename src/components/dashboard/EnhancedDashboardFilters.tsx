
import React, { useEffect, useState } from "react";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EnhancedDashboardFiltersProps {
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
  paymentMethod: string | null;
  setPaymentMethod: (method: string | null) => void;
  employee: string | null;
  setEmployee: (employee: string | null) => void;
  minAmount: number | null;
  setMinAmount: (amount: number | null) => void;
  maxAmount: number | null;
  setMaxAmount: (amount: number | null) => void;
}

export function EnhancedDashboardFilters({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedShops,
  setSelectedShops,
  selectedCategory,
  setSelectedCategory,
  selectedProduct,
  setSelectedProduct,
  paymentMethod,
  setPaymentMethod,
  employee,
  setEmployee,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount
}: EnhancedDashboardFiltersProps) {
  const { user } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchFilterData = async () => {
      try {
        // Fetch shops
        const { data: shopsData } = await supabase
          .from("shops")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name");
        
        setShops(shopsData || []);
        
        // Fetch categories and products
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, category")
          .eq("user_id", user.id)
          .order("name");
        
        const uniqueCategories = Array.from(
          new Set((productsData || []).map(product => product.category))
        ).map(category => ({
          name: category || "unnamed_category"
        }));
        
        setCategories(uniqueCategories);
        setProducts(productsData || []);

        // Fetch employees/operators from stocks table
        const { data: stocksData } = await supabase
          .from("stocks")
          .select("operator_name")
          .eq("user_id", user.id)
          .not("operator_name", "is", null);

        const uniqueEmployees = Array.from(
          new Set((stocksData || []).map(stock => stock.operator_name).filter(Boolean))
        ).map(name => ({ name }));

        setEmployees(uniqueEmployees);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    
    fetchFilterData();
  }, [user]);

  const setQuickDateRange = (range: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (range) {
      case "today":
        setStartDate(today);
        setEndDate(today);
        break;
      case "yesterday":
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setStartDate(startOfWeek);
        setEndDate(today);
        break;
      case "this_month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(startOfMonth);
        setEndDate(today);
        break;
      case "last_month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(lastMonth);
        setEndDate(endOfLastMonth);
        break;
    }
  };

  const clearAllFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedShops([]);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setPaymentMethod(null);
    setEmployee(null);
    setMinAmount(null);
    setMaxAmount(null);
  };

  const activeFiltersCount = [
    startDate,
    endDate,
    selectedShops.length > 0 ? true : false,
    selectedCategory,
    selectedProduct,
    paymentMethod,
    employee,
    minAmount,
    maxAmount
  ].filter(Boolean).length;

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Dashboard Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Date Presets */}
        <div>
          <Label className="text-sm font-medium">Quick Date Ranges</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "This Week", value: "this_week" },
              { label: "This Month", value: "this_month" },
              { label: "Last Month", value: "last_month" }
            ].map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Custom Date Range */}
          <div>
            <Label className="text-sm font-medium">Custom Date Range</Label>
            <div className="flex space-x-2 mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Start"}
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
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "End"}
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

          {/* Store Selection */}
          <div>
            <Label className="text-sm font-medium">Store</Label>
            <Select
              value={selectedShops.length === 1 ? selectedShops[0] : "all_stores"}
              onValueChange={(value) => {
                if (value === "all_stores") {
                  setSelectedShops([]);
                } else {
                  setSelectedShops([value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_stores">All Stores</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select
              value={paymentMethod || "all_payments"}
              onValueChange={(value) => setPaymentMethod(value === "all_payments" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_payments">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online/UPI</SelectItem>
                <SelectItem value="given">Credit Given</SelectItem>
                <SelectItem value="received">Credit Received</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={selectedCategory || "all_categories"}
              onValueChange={(value) => {
                setSelectedCategory(value === "all_categories" ? null : value);
                setSelectedProduct(null); // Reset product when category changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_categories">All Categories</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category.name || "unnamed_category"}>
                    {category.name || "Unnamed Category"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters - Only show when expanded */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Product */}
            <div>
              <Label className="text-sm font-medium">Product</Label>
              <Select
                value={selectedProduct || "all_products"}
                onValueChange={(value) => setSelectedProduct(value === "all_products" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_products">All Products</SelectItem>
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee/Operator */}
            <div>
              <Label className="text-sm font-medium">Employee/Operator</Label>
              <Select
                value={employee || "all_employees"}
                onValueChange={(value) => setEmployee(value === "all_employees" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">All Employees</SelectItem>
                  {employees.map((emp, index) => (
                    <SelectItem key={index} value={emp.name}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div>
              <Label className="text-sm font-medium">Min Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={minAmount || ""}
                onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Max Amount (₹)</Label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxAmount || ""}
                onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
