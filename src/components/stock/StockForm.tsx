
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Table, Upload, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const stockSchema = z.object({
  shop_id: z.string().uuid("Please select a shop"),
  product_id: z.string().uuid("Please select a product"),
  stock_date: z.date({
    required_error: "Stock date is required",
  }),
  opening_stock: z.coerce.number().int().min(0, "Must be a positive number"),
  closing_stock: z.coerce.number().int().min(0, "Must be a positive number"),
  actual_stock: z.coerce.number().int().min(0, "Must be a positive number"),
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

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      stock_date: new Date(),
      opening_stock: 0,
      closing_stock: 0,
      actual_stock: 0,
    },
  });

  // Get selected values
  const watchShopId = form.watch("shop_id");
  const watchProductId = form.watch("product_id");
  const watchStockDate = form.watch("stock_date");

  useEffect(() => {
    const fetchShopsAndProducts = async () => {
      try {
        const [shopsResponse, productsResponse] = await Promise.all([
          supabase.from("shops").select("id, name, address, phone").order("name"),
          supabase.from("products").select("id, name").order("name"),
        ]);

        if (shopsResponse.error) throw shopsResponse.error;
        if (productsResponse.error) throw productsResponse.error;

        setShops(shopsResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (error: any) {
        console.error("Error fetching shops and products:", error.message);
        toast.error("Failed to load shops and products");
      }
    };

    fetchShopsAndProducts();
  }, []);

  // Update selected shop details when shop_id changes
  useEffect(() => {
    if (watchShopId) {
      const shop = shops.find(shop => shop.id === watchShopId);
      setSelectedShop(shop);
    }
  }, [watchShopId, shops]);

  // Update selected product details when product_id changes
  useEffect(() => {
    if (watchProductId) {
      const product = products.find(product => product.id === watchProductId);
      setSelectedProduct(product);
    }
  }, [watchProductId, products]);

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

  const onSubmit = async (values: StockFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add stock entries");
      return;
    }

    try {
      setLoading(true);

      // Format the date as a string for Supabase
      const formattedDate = format(values.stock_date, "yyyy-MM-dd");

      const { error } = await supabase.from("stocks").insert({
        user_id: user.id,
        shop_id: values.shop_id,
        product_id: values.product_id,
        stock_date: formattedDate,
        opening_stock: values.opening_stock,
        closing_stock: values.closing_stock,
        actual_stock: values.actual_stock,
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Stock Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }} 
                      defaultValue={field.value}
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
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedShop && (
                <div className="col-span-2 bg-muted/50 p-3 rounded-md">
                  <h4 className="font-medium mb-2">Shop Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Address:</span> {selectedShop.address || 'N/A'}</div>
                    <div><span className="font-medium">Phone:</span> {selectedShop.phone || 'N/A'}</div>
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
                      />
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
              <Button type="submit" disabled={loading}>
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
