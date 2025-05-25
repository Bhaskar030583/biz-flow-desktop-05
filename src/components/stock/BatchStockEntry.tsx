import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  IndianRupee, 
  Save, 
  FileText, 
  Search, 
  Filter,
  Loader2,
  AlertCircle,
  Package,
  TrendingUp,
  Eye,
  EyeOff 
} from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

// Define the form schema
const batchStockSchema = z.object({
  shop_id: z.string().uuid("Please select a shop"),
  stock_date: z.date({
    required_error: "Stock date is required",
  }),
  shift: z.string().min(1, "Please select a shift"),
  operator_name: z.string().min(1, "Operator name is required"),
  products: z.array(
    z.object({
      product_id: z.string(),
      product_name: z.string(),
      category: z.string(),
      opening_stock: z.number(),
      closing_stock: z.coerce.number().int().min(0, "Must be a positive number"),
      actual_stock: z.coerce.number().int().min(0, "Must be a positive number"),
    })
  ),
});

type BatchStockFormValues = z.infer<typeof batchStockSchema>;

interface BatchStockEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockEntry = ({ onSuccess, onCancel }: BatchStockEntryProps) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnlyWithValues, setShowOnlyWithValues] = useState(false);
  const [highlightChanged, setHighlightChanged] = useState(true);

  // Define form with default values
  const form = useForm<BatchStockFormValues>({
    resolver: zodResolver(batchStockSchema),
    defaultValues: {
      stock_date: new Date(),
      shift: "",
      operator_name: "",
      products: [],
    },
  });

  // Watch for shop_id changes
  const watchShopId = form.watch("shop_id");
  const watchStockDate = form.watch("stock_date");
  const watchProducts = form.watch("products");

  // Load shops and products
  useEffect(() => {
    const fetchShopsAndProducts = async () => {
      try {
        const [shopsResponse, productsResponse] = await Promise.all([
          supabase.from("shops").select("id, name, address, phone").order("name"),
          supabase.from("products").select("id, name, price, cost_price, category").order("name"),
        ]);

        if (shopsResponse.error) throw shopsResponse.error;
        if (productsResponse.error) throw productsResponse.error;

        // Filter out shops and products with empty or invalid IDs
        const validShops = (shopsResponse.data || []).filter(shop => shop.id && shop.id.trim() !== "" && shop.name);
        const validProducts = (productsResponse.data || []).filter(product => product.id && product.id.trim() !== "" && product.name);

        setShops(validShops);
        
        // Initialize products array with all products
        const formattedProducts = validProducts.map(product => ({
          product_id: product.id,
          product_name: product.name,
          category: product.category || "Uncategorized",
          opening_stock: 0,
          closing_stock: 0,
          actual_stock: 0,
        }));
        
        setProducts(formattedProducts);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(validProducts.map(product => product.category || "Uncategorized"))
        );
        setCategories(uniqueCategories as string[]);
        
        if (uniqueCategories.length > 0) {
          setActiveCategory(uniqueCategories[0] as string);
        }
      } catch (error: any) {
        console.error("Error fetching shops and products:", error.message);
        toast.error("Failed to load shops and products");
      }
    };

    fetchShopsAndProducts();
  }, []);

  // Filter out shops with empty IDs for rendering
  const validShops = shops.filter(shop => shop.id && shop.id.trim() !== "" && shop.name);

  // Update shop selection
  useEffect(() => {
    if (watchShopId) {
      setSelectedShop(watchShopId);
    }
  }, [watchShopId]);

  // Load previous stock data when shop and date are selected
  useEffect(() => {
    const fetchPreviousStockData = async () => {
      if (!selectedShop || !watchStockDate) return;

      // Format the date for the query
      const formattedDate = format(watchStockDate, "yyyy-MM-dd");
      
      try {
        setLoading(true);
        
        // Get previous day's data for opening stock
        const previousDay = new Date(watchStockDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const prevFormattedDate = format(previousDay, "yyyy-MM-dd");
        
        const { data: prevData, error: prevError } = await supabase
          .from("stocks")
          .select(`
            product_id,
            actual_stock,
            products (id, name, category)
          `)
          .eq("shop_id", selectedShop)
          .eq("stock_date", prevFormattedDate);

        if (prevError && prevError.code !== "PGRST116") {
          throw prevError;
        }

        // Get all products
        const { data: allProducts, error: productsError } = await supabase
          .from("products")
          .select("id, name, category")
          .order("name");
          
        if (productsError) throw productsError;

        // Filter valid products
        const validProducts = (allProducts || []).filter(product => product.id && product.id.trim() !== "");

        // Map previous stock data or default to 0
        const productsWithStock = validProducts.map(product => {
          const prevStock = prevData?.find(item => item.product_id === product.id);
          return {
            product_id: product.id,
            product_name: product.name,
            category: product.category || "Uncategorized",
            opening_stock: prevStock ? prevStock.actual_stock : 0,
            closing_stock: 0,
            actual_stock: 0,
          };
        });

        // Set form data
        form.setValue("products", productsWithStock);
      } catch (error: any) {
        console.error("Error fetching previous stock data:", error.message);
        toast.error("Failed to load previous stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousStockData();
  }, [selectedShop, watchStockDate, form]);

  // Validate all products have values
  const validateAllProductsHaveValues = () => {
    const products = form.getValues().products;
    const incompleteProducts = products.filter(
      product => product.closing_stock === 0 && product.actual_stock === 0
    );
    
    if (incompleteProducts.length > 0) {
      setValidationError(`${incompleteProducts.length} products are missing values. Please enter closing stock or actual stock for all products.`);
      return false;
    }
    
    setValidationError("");
    return true;
  };

  const onSubmit = async (values: BatchStockFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add stock entries");
      return;
    }

    // Validate that all products have values
    if (!validateAllProductsHaveValues()) {
      toast.error("Please enter values for all products before saving");
      return;
    }

    try {
      setLoading(true);
      setIsSubmitting(true);
      
      // Format date for insertion
      const formattedDate = format(values.stock_date, "yyyy-MM-dd");
      
      // Check for existing entries for this date and shop
      const { data: existingEntries, error: checkError } = await supabase
        .from("stocks")
        .select("product_id")
        .eq("shop_id", values.shop_id)
        .eq("stock_date", formattedDate);
        
      if (checkError) throw checkError;
      
      // If there are existing entries, ask for confirmation
      if (existingEntries && existingEntries.length > 0) {
        const existingProductIds = existingEntries.map(entry => entry.product_id);
        const conflictingProducts = values.products.filter(
          product => existingProductIds.includes(product.product_id)
        );
        
        if (conflictingProducts.length > 0) {
          const confirmOverwrite = window.confirm(
            `${conflictingProducts.length} products already have stock entries for this date. Do you want to overwrite them?`
          );
          
          if (!confirmOverwrite) {
            setLoading(false);
            setIsSubmitting(false);
            return;
          }
          
          // Delete existing entries first
          const { error: deleteError } = await supabase
            .from("stocks")
            .delete()
            .eq("shop_id", values.shop_id)
            .eq("stock_date", formattedDate);
            
          if (deleteError) throw deleteError;
        }
      }
      
      // Prepare stock entries - only include products with values
      const stockEntries = values.products
        .filter(product => product.closing_stock > 0 || product.actual_stock > 0)
        .map(product => ({
          user_id: user.id,
          shop_id: values.shop_id,
          product_id: product.product_id,
          stock_date: formattedDate,
          opening_stock: product.opening_stock,
          closing_stock: product.closing_stock,
          actual_stock: product.actual_stock,
          shift: values.shift,
          operator_name: values.operator_name,
        }));

      // Insert stock entries in batches to avoid size limits
      const batchSize = 50;
      for (let i = 0; i < stockEntries.length; i += batchSize) {
        const batch = stockEntries.slice(i, i + batchSize);
        const { error } = await supabase.from("stocks").insert(batch);
        
        if (error) throw error;
      }

      toast.success("Stock entries added successfully");
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error adding stock entries:", error.message);
      toast.error(error.message || "Failed to add stock entries");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Filter products by search term, category, and value filter
  const filteredProducts = form.watch("products").filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory ? product.category === activeCategory : true;
    const hasValues = product.closing_stock > 0 || product.actual_stock > 0;
    const matchesValueFilter = showOnlyWithValues ? hasValues : true;
    return matchesSearch && matchesCategory && matchesValueFilter;
  });

  // Calculate total stock value for current products
  const calculateTotalStockValue = () => {
    return form.watch("products").reduce((total, product) => {
      // Get product price from the products list
      const productInfo = products.find(p => p.product_id === product.product_id);
      const price = productInfo?.price || 0;
      const stockValue = product.actual_stock * price;
      return total + stockValue;
    }, 0);
  };

  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Quick input functions
  const handleQuickFill = (productIndex: number, type: 'closing' | 'actual', value: number) => {
    const newProducts = [...form.getValues().products];
    if (type === 'closing') {
      newProducts[productIndex].closing_stock = value;
    } else {
      newProducts[productIndex].actual_stock = value;
    }
    form.setValue("products", newProducts);
  };

  const handleCopyToActual = (productIndex: number) => {
    const newProducts = [...form.getValues().products];
    newProducts[productIndex].actual_stock = newProducts[productIndex].closing_stock;
    form.setValue("products", newProducts);
  };

  // Group products by category for better organization
  const groupedProducts = filteredProducts.reduce((groups: Record<string, any[]>, product) => {
    const category = product.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});

  // Calculate total products and products with data
  const totalProducts = form.watch("products").length;
  const productsWithData = form.watch("products").filter(p => p.closing_stock > 0 || p.actual_stock > 0).length;
  
  // Calculate progress percentage
  const progressPercentage = totalProducts > 0 ? (productsWithData / totalProducts) * 100 : 0;

  return (
    <Card className="max-w-6xl mx-auto shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
        <CardTitle className="text-2xl font-bold text-blue-800 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Batch Stock Entry
        </CardTitle>
        <CardDescription className="text-blue-600">
          Enter closing stock for multiple products at once
        </CardDescription>
        
        {/* Stock Value Summary */}
        <div className="flex items-center gap-4 mt-4 p-3 bg-white rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Total Stock Value:</span>
            <span className="text-lg font-bold text-green-600">
              {formatIndianRupee(calculateTotalStockValue())}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Products with Data:</span>
            <span className="text-lg font-bold text-blue-600">
              {productsWithData} / {totalProducts}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-700">Shop</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-indigo-200 focus:ring-indigo-300">
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {validShops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id || `shop_${shop.name}`}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-indigo-700">Stock Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal border-indigo-200 focus:ring-indigo-300 ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="bg-white rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-700">Shift</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-indigo-200 focus:ring-indigo-300">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operator_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-indigo-700">Operator Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter operator name" 
                        {...field} 
                        className="border-indigo-200 focus:ring-indigo-300"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-blue-700">Loading products and previous stock data...</span>
              </div>
            ) : (
              <div className="space-y-6 bg-gradient-to-r from-white to-blue-50/20 rounded-lg border border-blue-100 p-5">
                {/* Enhanced Filter Section */}
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                      <Input 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 border-blue-200 focus:ring-blue-300"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {/* View Options */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showOnlyWithValues}
                        onCheckedChange={setShowOnlyWithValues}
                        id="show-values"
                      />
                      <label htmlFor="show-values" className="text-sm font-medium text-blue-700 flex items-center gap-1">
                        {showOnlyWithValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        Show only with values
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={highlightChanged}
                        onCheckedChange={setHighlightChanged}
                        id="highlight-changed"
                      />
                      <label htmlFor="highlight-changed" className="text-sm font-medium text-blue-700">
                        Highlight changes
                      </label>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">Category:</span>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={!activeCategory ? "default" : "outline"}
                          className={`cursor-pointer hover:bg-blue-100 ${!activeCategory ? 'bg-blue-600' : 'border-blue-200 text-blue-700'}`}
                          onClick={() => setActiveCategory(null)}
                        >
                          All
                        </Badge>
                        {categories.map(category => (
                          <Badge 
                            key={category} 
                            variant={activeCategory === category ? "default" : "outline"}
                            className={`cursor-pointer hover:bg-blue-100 ${activeCategory === category ? 'bg-blue-600' : 'border-blue-200 text-blue-700'}`}
                            onClick={() => setActiveCategory(category)}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="flex items-center justify-between text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                  <span>
                    {productsWithData} of {totalProducts} products completed ({Math.round(progressPercentage)}%)
                  </span>
                  <span>
                    {filteredProducts.length} products shown
                  </span>
                </div>

                <div className="relative pt-1">
                  <div className="overflow-hidden h-3 text-xs flex rounded-full bg-blue-200">
                    <div 
                      style={{ width: `${progressPercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                    ></div>
                  </div>
                </div>

                {/* Enhanced Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-green-50">
                        <th className="text-left py-3 px-4 text-blue-800 font-semibold border-b border-blue-200">Product</th>
                        <th className="text-left py-3 px-4 text-blue-800 font-semibold border-b border-blue-200">Category</th>
                        <th className="text-center py-3 px-4 text-blue-800 font-semibold border-b border-blue-200">Opening</th>
                        <th className="text-center py-3 px-4 text-green-800 font-semibold border-b border-blue-200">Closing Stock</th>
                        <th className="text-center py-3 px-4 text-green-800 font-semibold border-b border-blue-200">Actual Stock</th>
                        <th className="text-center py-3 px-4 text-blue-800 font-semibold border-b border-blue-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product, index) => {
                          const productIndex = form.getValues().products.findIndex(
                            p => p.product_id === product.product_id
                          );
                          
                          const hasChanges = product.closing_stock > 0 || product.actual_stock > 0;
                          
                          return (
                            <tr 
                              key={product.product_id} 
                              className={`border-b border-blue-100 hover:bg-blue-50/50 transition-colors ${
                                highlightChanged && hasChanges ? 'bg-green-50 border-green-200' : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-blue-800 font-medium">{product.product_name}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="border-blue-200 text-blue-600">
                                  {product.category}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="bg-gray-100 rounded-lg px-3 py-2 text-gray-700 font-semibold">
                                  {product.opening_stock}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    className={`w-20 text-center border-green-200 focus:ring-green-300 ${
                                      product.closing_stock > 0 ? 'bg-green-50 border-green-300' : ''
                                    }`}
                                    value={product.closing_stock}
                                    onChange={(e) => {
                                      const newProducts = [...form.getValues().products];
                                      newProducts[productIndex].closing_stock = parseInt(e.target.value) || 0;
                                      form.setValue("products", newProducts);
                                    }}
                                    placeholder="0"
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs border-blue-200"
                                      onClick={() => handleQuickFill(productIndex, 'closing', product.opening_stock)}
                                    >
                                      Same
                                    </Button>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    className={`w-20 text-center border-green-200 focus:ring-green-300 ${
                                      product.actual_stock > 0 ? 'bg-green-50 border-green-300' : ''
                                    }`}
                                    value={product.actual_stock}
                                    onChange={(e) => {
                                      const newProducts = [...form.getValues().products];
                                      newProducts[productIndex].actual_stock = parseInt(e.target.value) || 0;
                                      form.setValue("products", newProducts);
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs border-blue-200 text-blue-600"
                                  onClick={() => handleCopyToActual(productIndex)}
                                  disabled={product.closing_stock === 0}
                                >
                                  Copy →
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-blue-600">
                            <FileText className="h-12 w-12 mx-auto mb-2 text-blue-300" />
                            <p>No products match your filter. Try adjusting your search or filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Stock Entries
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BatchStockEntry;
