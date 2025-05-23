
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, IndianRupee, Save } from "lucide-react";
import { toast } from "sonner";

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

  // Group products by category for better organization
  const groupedProducts = form.watch("products").reduce((groups: Record<string, any[]>, product) => {
    const category = products.find(p => p.product_id === product.product_id)?.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Batch Stock Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Stock Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
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
                    <FormLabel>Shift</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Operator Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter operator name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/20 p-4 rounded-md">
              <h3 className="font-medium mb-4">Stock Entries</h3>
              
              {loading ? (
                <div className="text-center py-4">Loading products and previous stock data...</div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="font-medium text-primary">{category}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Product</th>
                              <th className="text-right py-2 px-3">Opening Stock</th>
                              <th className="text-right py-2 px-3">Closing Stock</th>
                              <th className="text-right py-2 px-3">Actual Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryProducts.map((product, index) => {
                              const productIndex = form.getValues().products.findIndex(
                                p => p.product_id === product.product_id
                              );
                              
                              return (
                                <tr key={product.product_id} className="border-b border-muted">
                                  <td className="py-2 px-3">{product.product_name}</td>
                                  <td className="py-2 px-3 text-right">
                                    {product.opening_stock}
                                  </td>
                                  <td className="py-2 px-3">
                                    <Input
                                      type="number"
                                      className="w-24 ml-auto text-right"
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
                                      className="w-24 ml-auto text-right"
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save All Stock Entries"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BatchStockEntry;
