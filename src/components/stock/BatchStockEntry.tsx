
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
  Loader2 
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

        setShops(shopsResponse.data || []);
        
        // Initialize products array with all products
        const formattedProducts = (productsResponse.data || []).map(product => ({
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          opening_stock: 0,
          closing_stock: 0,
          actual_stock: 0,
        }));
        
        setProducts(formattedProducts);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((productsResponse.data || []).map(product => product.category))
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

        // Map previous stock data or default to 0
        const productsWithStock = allProducts?.map(product => {
          const prevStock = prevData?.find(item => item.product_id === product.id);
          return {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            opening_stock: prevStock ? prevStock.actual_stock : 0,
            closing_stock: 0,
            actual_stock: 0,
          };
        }) || [];

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

  const onSubmit = async (values: BatchStockFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add stock entries");
      return;
    }

    try {
      setLoading(true);
      
      // Format date for insertion
      const formattedDate = format(values.stock_date, "yyyy-MM-dd");
      
      // Prepare stock entries
      const stockEntries = values.products.map(product => ({
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
    }
  };

  // Filter products by search term and category
  const filteredProducts = form.watch("products").filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory ? product.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

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
    <Card className="max-w-6xl mx-auto shadow-lg border-indigo-100">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <CardTitle className="text-2xl font-bold text-indigo-800">Batch Stock Entry</CardTitle>
        <CardDescription className="text-indigo-600">
          Enter closing stock for multiple products at once
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
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
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="ml-2 text-indigo-700">Loading products and previous stock data...</span>
              </div>
            ) : (
              <div className="space-y-6 bg-gradient-to-r from-white to-indigo-50/20 rounded-lg border border-indigo-100 p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                      <Input 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 border-indigo-200 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-700">Filter by Category:</span>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant={!activeCategory ? "default" : "outline"}
                        className={`cursor-pointer hover:bg-indigo-100 ${!activeCategory ? 'bg-indigo-600' : 'border-indigo-200 text-indigo-700'}`}
                        onClick={() => setActiveCategory(null)}
                      >
                        All
                      </Badge>
                      {categories.map(category => (
                        <Badge 
                          key={category} 
                          variant={activeCategory === category ? "default" : "outline"}
                          className={`cursor-pointer hover:bg-indigo-100 ${activeCategory === category ? 'bg-indigo-600' : 'border-indigo-200 text-indigo-700'}`}
                          onClick={() => setActiveCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-indigo-700">
                  <span>
                    {productsWithData} of {totalProducts} products completed ({Math.round(progressPercentage)}%)
                  </span>
                  <span>
                    {Object.keys(filteredProducts.length > 0 ? groupedProducts : {}).length} categories shown
                  </span>
                </div>

                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-indigo-200">
                    <div 
                      style={{ width: `${progressPercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500"
                    ></div>
                  </div>
                </div>

                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="mb-4 bg-indigo-100/50">
                    <TabsTrigger value="table" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="accordion" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                      Category View
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="table" className="border-none p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-indigo-50">
                            <th className="text-left py-2 px-3 text-indigo-800 font-medium">Product</th>
                            <th className="text-left py-2 px-3 text-indigo-800 font-medium">Category</th>
                            <th className="text-right py-2 px-3 text-indigo-800 font-medium">Opening Stock</th>
                            <th className="text-right py-2 px-3 text-indigo-800 font-medium">Closing Stock</th>
                            <th className="text-right py-2 px-3 text-indigo-800 font-medium">Actual Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => {
                              const productIndex = form.getValues().products.findIndex(
                                p => p.product_id === product.product_id
                              );
                              
                              return (
                                <tr key={product.product_id} className="border-b border-indigo-100 hover:bg-indigo-50/30">
                                  <td className="py-3 px-3 text-indigo-800">{product.product_name}</td>
                                  <td className="py-3 px-3 text-indigo-600">{product.category}</td>
                                  <td className="py-3 px-3 text-right font-medium text-indigo-800">
                                    {product.opening_stock}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Input
                                      type="number"
                                      className="w-24 ml-auto text-right border-indigo-200 focus:ring-indigo-300"
                                      value={product.closing_stock}
                                      onChange={(e) => {
                                        const newProducts = [...form.getValues().products];
                                        newProducts[productIndex].closing_stock = parseInt(e.target.value) || 0;
                                        form.setValue("products", newProducts);
                                      }}
                                    />
                                  </td>
                                  <td className="py-3 px-3">
                                    <Input
                                      type="number"
                                      className="w-24 ml-auto text-right border-indigo-200 focus:ring-indigo-300"
                                      value={product.actual_stock}
                                      onChange={(e) => {
                                        const newProducts = [...form.getValues().products];
                                        newProducts[productIndex].actual_stock = parseInt(e.target.value) || 0;
                                        form.setValue("products", newProducts);
                                      }}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-indigo-600">
                                <FileText className="h-12 w-12 mx-auto mb-2 text-indigo-300" />
                                <p>No products match your filter. Try adjusting your search or filters.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="accordion" className="border-none p-0">
                    {Object.keys(groupedProducts).length > 0 ? (
                      <Accordion type="multiple" defaultValue={[Object.keys(groupedProducts)[0]]} className="space-y-4">
                        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                          <AccordionItem 
                            key={category} 
                            value={category}
                            className="border border-indigo-100 rounded-md overflow-hidden"
                          >
                            <AccordionTrigger className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium">
                              {category} <span className="ml-2 text-indigo-500 text-xs font-normal">({categoryProducts.length} items)</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b border-indigo-100">
                                      <th className="text-left py-2 px-3 text-indigo-700 font-medium">Product</th>
                                      <th className="text-right py-2 px-3 text-indigo-700 font-medium">Opening Stock</th>
                                      <th className="text-right py-2 px-3 text-indigo-700 font-medium">Closing Stock</th>
                                      <th className="text-right py-2 px-3 text-indigo-700 font-medium">Actual Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {categoryProducts.map((product) => {
                                      const productIndex = form.getValues().products.findIndex(
                                        p => p.product_id === product.product_id
                                      );
                                      
                                      return (
                                        <tr key={product.product_id} className="border-b border-indigo-50 hover:bg-indigo-50/30">
                                          <td className="py-2 px-3 text-indigo-800">{product.product_name}</td>
                                          <td className="py-2 px-3 text-right font-medium text-indigo-800">
                                            {product.opening_stock}
                                          </td>
                                          <td className="py-2 px-3">
                                            <Input
                                              type="number"
                                              className="w-24 ml-auto text-right border-indigo-200 focus:ring-indigo-300"
                                              value={product.closing_stock}
                                              onChange={(e) => {
                                                const newProducts = [...form.getValues().products];
                                                newProducts[productIndex].closing_stock = parseInt(e.target.value) || 0;
                                                form.setValue("products", newProducts);
                                              }}
                                            />
                                          </td>
                                          <td className="py-2 px-3">
                                            <Input
                                              type="number"
                                              className="w-24 ml-auto text-right border-indigo-200 focus:ring-indigo-300"
                                              value={product.actual_stock}
                                              onChange={(e) => {
                                                const newProducts = [...form.getValues().products];
                                                newProducts[productIndex].actual_stock = parseInt(e.target.value) || 0;
                                                form.setValue("products", newProducts);
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="py-10 text-center text-indigo-600 bg-indigo-50/30 rounded-md border border-indigo-100">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-indigo-300" />
                        <p>No products match your filter. Try adjusting your search or filters.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? (
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
