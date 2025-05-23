
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
import { CalendarIcon, Table, Upload } from "lucide-react";
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

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      stock_date: new Date(),
      opening_stock: 0,
      closing_stock: 0,
      actual_stock: 0,
    },
  });

  useEffect(() => {
    const fetchShopsAndProducts = async () => {
      try {
        const [shopsResponse, productsResponse] = await Promise.all([
          supabase.from("shops").select("id, name").order("name"),
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

  const onSubmit = async (values: StockFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add stock entries");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("stocks").insert({
        ...values,
        user_id: user.id,
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
                      onValueChange={field.onChange} 
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
