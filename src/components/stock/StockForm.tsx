
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
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const stockSchema = z.object({
  shop_id: z.string().uuid("Please select a shop"),
  product_id: z.string().uuid("Please select a product"),
  stock_date: z.date({
    required_error: "Stock date is required",
  }),
  opening_stock: z.coerce.number().int().min(0, "Must be a positive number"),
  closing_stock: z.coerce.number().int().min(0, "Must be a positive number"),
  actual_stock: z.coerce.number().int().min(0, "Must be a positive number"),
  stock_added: z.coerce.number().int().min(0, "Must be a positive number"),
  operator_name: z.string().optional(),
});

type StockFormValues = z.infer<typeof stockSchema>;

interface StockFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StockForm = ({ onSuccess, onCancel }: StockFormProps) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [validationError, setValidationError] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      stock_date: new Date(),
      opening_stock: 0,
      closing_stock: 0,
      actual_stock: 0,
      stock_added: 0,
      operator_name: "",
    },
  });

  // Get selected values
  const watchShopId = form.watch("shop_id");
  const watchProductId = form.watch("product_id");
  const watchStockDate = form.watch("stock_date");

  useEffect(() => {
    const fetchShopsAndProducts = async () => {
      try {
        // Fetch HRMS stores instead of shops
        const [storesResponse, productsResponse] = await Promise.all([
          supabase.from("hr_stores").select("id, store_name, store_code, address").order("store_name"),
          supabase.from("products").select("id, name").order("name"),
        ]);

        if (storesResponse.error) throw storesResponse.error;
        if (productsResponse.error) throw productsResponse.error;

        // Transform HRMS stores to match shop interface
        const transformedStores = storesResponse.data?.map(store => ({
          id: store.id,
          name: store.store_name,
          address: store.address,
          phone: null, // HRMS stores don't have phone field
          store_code: store.store_code
        })) || [];

        setShops(transformedStores);
        setProducts(productsResponse.data || []);
      } catch (error: any) {
        console.error("Error fetching shops and products:", error.message);
        toast.error("Failed to load shops and products");
      }
    };

    fetchShopsAndProducts();
  }, []);

  // Enhanced validation with stricter checks
  const isValidShop = (shop: any): shop is { id: string; name: string; store_code?: string } => {
    return (
      shop &&
      typeof shop === 'object' &&
      typeof shop.id === 'string' &&
      typeof shop.name === 'string' &&
      shop.id.trim().length > 0 &&
      shop.name.trim().length > 0 &&
      shop.id !== "null" &&
      shop.id !== "undefined" &&
      shop.name !== "null" &&
      shop.name !== "undefined"
    );
  };

  const isValidProduct = (product: any): product is { id: string; name: string } => {
    return (
      product &&
      typeof product === 'object' &&
      typeof product.id === 'string' &&
      typeof product.name === 'string' &&
      product.id.trim().length > 0 &&
      product.name.trim().length > 0 &&
      product.id !== "null" &&
      product.id !== "undefined" &&
      product.name !== "null" &&
      product.name !== "undefined"
    );
  };

  const validShops = Array.isArray(shops) ? shops.filter(isValidShop) : [];
  const validProducts = Array.isArray(products) ? products.filter(isValidProduct) : [];

  // Update selected shop details when shop_id changes
  useEffect(() => {
    if (watchShopId) {
      const shop = validShops.find(shop => shop.id === watchShopId);
      setSelectedShop(shop);
    }
  }, [watchShopId, validShops]);

  // Update selected product details when product_id changes
  useEffect(() => {
    if (watchProductId) {
      const product = validProducts.find(product => product.id === watchProductId);
      setSelectedProduct(product);
    }
  }, [watchProductId, validProducts]);

  // Check for duplicate entries when shop, product, or date changes
  useEffect(() => {
    const checkDuplicateEntry = async () => {
      // Reset duplicate state when any key field changes
      setIsDuplicate(false);
      setDuplicateId(null);
      
      if (!watchShopId || !watchProductId || !watchStockDate) {
        return;
      }

      try {
        const formattedDate = format(watchStockDate, "yyyy-MM-dd");
        
        const { data, error } = await supabase
          .from("stocks")
          .select("id")
          .eq("shop_id", watchShopId)
          .eq("product_id", watchProductId)
          .eq("stock_date", formattedDate)
          .single();

        if (error && error.code !== "PGRST116") { // No rows returned
          console.error("Error checking for duplicate entries:", error);
          return;
        }

        if (data) {
          setIsDuplicate(true);
          setDuplicateId(data.id);
          toast.error("A stock entry already exists for this shop, product, and date", {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error checking for duplicate:", error);
      }
    };

    const timer = setTimeout(() => {
      checkDuplicateEntry();
    }, 300); // Add a small delay to avoid too many requests during form filling

    return () => clearTimeout(timer);
  }, [watchShopId, watchProductId, watchStockDate]);

  // Fetch previous day's actual stock and update opening stock
  useEffect(() => {
    const fetchPreviousStock = async () => {
      if (!watchShopId || !watchProductId || !watchStockDate) return;

      // Calculate previous day
      const previousDay = new Date(watchStockDate);
      previousDay.setDate(previousDay.getDate() - 1);
      
      try {
        const { data, error } = await supabase
          .from("stocks")
          .select("actual_stock")
          .eq("shop_id", watchShopId)
          .eq("product_id", watchProductId)
          .eq("stock_date", format(previousDay, "yyyy-MM-dd"))
          .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
          console.error("Error fetching previous stock:", error);
          return;
        }

        // If previous day's data exists, update opening stock
        if (data) {
          form.setValue("opening_stock", data.actual_stock);
        }
      } catch (error: any) {
        console.error("Error fetching previous stock:", error.message);
      }
    };

    fetchPreviousStock();
  }, [watchShopId, watchProductId, watchStockDate, form]);

  const validateAllFieldsFilled = (values: StockFormValues) => {
    // Check if all required fields are filled
    if (!values.shop_id || !values.product_id || !values.stock_date) {
      setValidationError("All fields are required before saving");
      return false;
    }
    
    // Clear any previous validation errors
    setValidationError("");
    return true;
  };

  const onSubmit = async (values: StockFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add stock entries");
      return;
    }
    
    // Check if all fields are filled
    if (!validateAllFieldsFilled(values)) {
      return;
    }

    // Final check for duplicates
    if (isDuplicate) {
      toast.error("Cannot submit: A stock entry already exists for this shop, product, and date");
      return;
    }

    try {
      setLoading(true);

      // Format the date as a string for Supabase
      const formattedDate = format(values.stock_date, "yyyy-MM-dd");

      // One more safety check for duplicates right before insert
      const { data: existingData, error: checkError } = await supabase
        .from("stocks")
        .select("id")
        .eq("shop_id", values.shop_id)
        .eq("product_id", values.product_id)
        .eq("stock_date", formattedDate)
        .single();
        
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      if (existingData) {
        setIsDuplicate(true);
        setDuplicateId(existingData.id);
        throw new Error("A duplicate stock entry already exists");
      }

      const { error } = await supabase.from("stocks").insert({
        user_id: user.id,
        shop_id: values.shop_id,
        product_id: values.product_id,
        stock_date: formattedDate,
        opening_stock: values.opening_stock,
        closing_stock: values.closing_stock,
        actual_stock: values.actual_stock,
        stock_added: values.stock_added,
        operator_name: values.operator_name || null,
      });

      if (error) throw error;

      toast.success("Stock entry added successfully");
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error adding stock entry:", error.message);
      toast.error(error.message || "Failed to add stock entry");
    } finally {
      setLoading(false);
    }
  };

  // Format number inputs to display with proper formatting
  const formatNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') return;
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      // Format to show as a number with commas
      return numValue.toLocaleString();
    }
    return value;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Stock Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            
            {isDuplicate && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Duplicate Entry Detected</AlertTitle>
                <AlertDescription>
                  A stock entry already exists for this shop, product, and date.
                  Please choose a different combination or update the existing entry instead.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a store" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
                        {validShops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name} {shop.store_code && `(${shop.store_code})`}
                          </SelectItem>
                        ))}
                        {validShops.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No stores available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white z-50">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedShop && (
                <div className="col-span-2 bg-muted/50 p-3 rounded-md">
                  <h4 className="font-medium mb-2">Store Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Address:</span> {selectedShop.address || 'N/A'}</div>
                    <div><span className="font-medium">Store Code:</span> {selectedShop.store_code || 'N/A'}</div>
                  </div>
                </div>
              )}

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
                            variant={"outline"}
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
                          onSelect={(date) => {
                            field.onChange(date);
                          }}
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
                name="opening_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          e.target.value = formatNumberInput(e) || e.target.value;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stock_added"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Added</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          e.target.value = formatNumberInput(e) || e.target.value;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closing_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          e.target.value = formatNumberInput(e) || e.target.value;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          e.target.value = formatNumberInput(e) || e.target.value;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="operator_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter operator name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isDuplicate}>
                {loading ? "Saving..." : "Save Stock Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StockForm;
